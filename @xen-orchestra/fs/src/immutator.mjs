
import {resolve} from 'node:path'
import fs from 'node:fs/promises'

import execa from 'execa'

// reimplement resolveVhdAlias here, since I don't want to pull the full vhd and fs package
// for now : doesn't handle encryption

const ALIAS_MAX_PATH_LENGTH = 1024
async function resolveAlias(aliasPath){
    const {size } = await fs.stat(aliasPath)
    if (size > ALIAS_MAX_PATH_LENGTH) {
    // seems reasonnable for a relative path
    throw new Error(`The alias file ${aliasPath} is too big (${size} bytes)`)
    }
    const aliasContent = (await fs.readFile(aliasPath)).toString().trim()
    return resolve(aliasPath,aliasContent )
} 

const makeFileImmutable = async (path) => execa('chattr', ['-i', path])
const makeDirectoryImmutable = async (path) => execa('chattr', ['-i', '-R', path])


async function makeVhdImmutable(vhdPath){
    await makeFileImmutable(vhdPath)
    // also make the target immutable
    if(vhdPath.endsWith('.alias.vhd')){
        const targetVhd = await resolveAlias(vhdPath)
        await makeDirectoryImmutable(targetVhd)
    }
}


async function makeImmutable(link){
    try{
        const path = await resolveAlias(link)
        const metadata = JSON.parse(await fs.readFile(path))
        if(metadata.xva !== undefined){
            await makeFileImmutable(path.resolve(path, metadata.xva))
        } else if(metadata.vhds !== undefined){
            for(const vhd of Object.values(metadata.vhds)){
                await makeVhdImmutable(path.resolve(path, vhd))
            }
        } else {
            throw new Error('File is not a metadata')
        }
        metadata.immutableSince = + new Date()
        metadata.immutable = true// write new metadata
        await fs.writeFile(path, JSON.stringify(metadata))
        // cache is stale
        await fs.unlink(resolve(path, './cache.json.gz'))

        // mark this as done
        await fs.unlink(link)
    }catch(err){
        // rename event is also launched on deletion
        if(err.code !== 'ENOENT'){
            throw err
        }
    }

}


async function watchVmDirectory(remotePath, vmPath){
    try {
        const watcher = fs.watch(remotePath+'/'+vmPath);
        for await (const {eventType, filename} of watcher){
            console.log({eventType, filename})
            // ignore modified metadata (merge , became immutable , deleted  )

            if(filename.endsWith('.json')){
                const stat = await fs.stat(filename)
                if(stat.ctime === stat.mtime){
                    // only make immutable unmodified files
                    await makeImmutable(filename)
                }
            }
        } 
    }
      catch (err) {
        // must not throw and stop the script
        // throw err;
      }
}
async function watchRemote(remotePath){
    
    // watch new VM 
    const watcher = fs.watch(remotePath, { signal });
    for await (const {eventType, filename} of watcher){
        console.log({eventType, filename})
        watchVmDirectory(remotePath, filename)
            .catch(()=>{})
    } 

    // also watch existing VM
    const vms = await fs.readDir(remotePath)
    for(const vm of vms){
        watchVmDirectory(remotePath, vm)
            .catch(()=>{})
    }
}



watchRemote()

/**
 * Caveats : 
 *  data is protected only after the upload is done: in theory an attacker with access to the FS could modify 
 *  the data during upload of a vhddirectory 
 */