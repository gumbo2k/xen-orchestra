<template>
  <ComponentStory
    :params="[
      model()
        .required()
        .type('boolean')
        .help('Whether the modal is opened or not'),
      prop('closable')
        .bool()
        .default(true)
        .widget()
        .help('If true, the modal can be closed by clicking on the overlay'),
      slot().help('Place your ModalContainer here'),
    ]"
  >
    <button type="button" @click="open">Open modal</button>
    <UiModal v-model="isOpen">
      <BasicModalLayout> Here is a modal... </BasicModalLayout>
    </UiModal>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import BasicModalLayout from "@/components/ui/modals/layouts/BasicModalLayout.vue";
import UiModal from "@/components/ui/modals/UiModal.vue";
import useModal from "@/composables/modal.composable";
import { model, prop, slot } from "@/libs/story/story-param";

const { isOpen, open } = useModal();
</script>
