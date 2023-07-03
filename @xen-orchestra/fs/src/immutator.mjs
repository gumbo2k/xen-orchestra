
import fs from 'node:fs/promises'
import path from 'node:path'

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
    return path.resolve(aliasPath,aliasContent )
} 

const makeFileImmutable = async (path) => execa('chattr', ['+i', path])
const makeDirectoryImmutable = async (path) => execa('chattr', ['+i', '-R', path])


async function makeVhdImmutable(vhdPath){
    console.log('Make vhd immutable')
    await makeFileImmutable(vhdPath)
    // also make the target immutable
    if(vhdPath.endsWith('.alias.vhd')){
        const targetVhd = await resolveAlias(vhdPath)
        await makeDirectoryImmutable(targetVhd)
    }
}


async function makeVmBackupImmutable(metdataPath){
    try{
        const metadataDir = path.dirname(metdataPath)
        const metadata = JSON.parse(await fs.readFile(metdataPath))
        if(metadata.xva !== undefined){
            console.log('make xva immutable ',path.resolve(metadataDir, metadata.xva))
            await makeFileImmutable(path.resolve(metadataDir, metadata.xva))
            await makeFileImmutable(path.resolve(metadataDir, metadata.xva+'.checksum'))
        } else if(metadata.vhds !== undefined){
            for(const vhd of Object.values(metadata.vhds)){
                console.log('make vhd immutable ',path.resolve(metadataDir, vhd))
                await makeVhdImmutable(path.resolve(metadataDir, vhd))
            }
        } else {
            throw new Error('File is not a metadata')
        }
        console.log('patch metadata')
        // update metadata
        metadata.immutableSince = + new Date()
        metadata.immutable = true// write new metadata
        console.log('write metadata')
        await fs.writeFile(metdataPath, JSON.stringify(metadata))
        console.log('make metadata immutable')
        await makeFileImmutable(metdataPath)
        // cache is stale, kill it
        console.log('snipe cache')
        await fs.unlink(path.resolve(metadataDir, 'cache.json.gz'))

    }catch(err){
        console.warn(err)
        // rename event is also launched on deletion
        if(err.code !== 'ENOENT'){
            throw err
        }
    }

}


async function watchVmDirectory(vmPath){
    if(vmPath.endsWith('.lock')){
        console.log(vmPath, ' is lock dir, skip')
        return 
    }
    console.log('watchVmDirectory', vmPath)
    try {
        const watcher = fs.watch(vmPath);
        for await (const {eventType, filename} of watcher){
            if(eventType === 'change'){
                continue
            }
            if(filename.startsWith('.')){
                // temp file during upload
                continue
            }
            console.log({eventType, filename})
            // ignore modified metadata (merge , became immutable , deleted  )

            if(filename.endsWith('.json')){
                console.log('is json')
                const stat = await fs.stat(path.join(vmPath,filename))
                if(stat.ctimeMs === stat.mtimeMs){
                    console.log('just created')
                    // only make immutable unmodified files
                    await makeVmBackupImmutable(path.join(vmPath,filename))
                }
            }
        } 
    }
      catch (err) {
        console.warn(err)
        // must not throw and stop the script
        // throw err;
        if(err.code !== 'ENOENT' && err.code !== 'EPERM' /* demete on windows */){
            watchVmDirectory(vmPath)
        }
      }
}


async function watchForNewVm(vmPath){
    // watch new VM 
    try{

        const watcher = fs.watch(vmPath);
        for await (const {filename} of watcher){
            watchVmDirectory(path.join(vmPath, filename))
                .catch(()=>{})
        } 
    }catch(err){
        console.warn(err)
        // must not throw and stop the script
        // throw err;
        if(err.code !== 'ENOENT'){
            // relaunch watcher on error
            watchVmDirectory(vmPath)
        }

    }
}

async function watchVmRemote(remotePath){
    const vmPath = path.join(remotePath, 'xo-vm-backups')
    console.log(vmPath)

    watchForNewVm(vmPath).catch(()=>{})

    // watch existing VM
    const vms = await fs.readdir(vmPath)
    console.log({vms})
    for(const vm of vms){
        console.log('watch ', vm)
        watchVmDirectory(path.join(vmPath, vm))
            .catch(()=>{})
    }




}



watchVmRemote('/home/florent/Documents/remotes/nonencrypted')

/**
 * Caveats : 
 *  data is protected only after the upload is done: in theory an attacker with access to the FS could modify 
 *  the data during upload of a vhddirectory 
 */