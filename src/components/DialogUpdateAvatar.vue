<template>
  <v-dialog :value="show" @input="$emit('close', $event)" max-width="650">
    <v-card>
      <v-card-title class="headline">Update Profile Avatar</v-card-title>

      <v-card-text>
        <v-container grid-list-md>
          <v-row class="flex">
            <v-col v-show="!videoCaptureStream && !avatarData">
              <img v-show="curAvatarUrl" :src="curAvatarUrl" :width="avatarWidth" :height="avatarHeigth" />
            </v-col>

            <v-col v-show="videoCaptureStream">
              <video ref="videoCapture" :width="avatarWidth" :height="avatarHeigth" autoplay="off" />
            </v-col>

            <v-col v-show="avatarData && !videoCaptureStream">
              <canvas ref="snapshotCapture" :width="avatarWidth" :height="avatarHeigth" />
            </v-col>

            <v-col>
              <v-btn
                color="green darken-1"
                text
                v-if="canCapture"
                @click="videoCaptureStream ? snapshotStream() : captureStream()"
                :disabled="isDisabled"
                data-testid="btn-action-capture"
                >{{ videoCaptureStream ? 'Take Photo' : 'Capture' }}</v-btn
              >
            </v-col>

            <v-col>
              <v-btn
                color="green darken-1"
                text
                @click="browseFile"
                :disabled="isDisabled"
                data-testid="btn-action-browse"
              >
                Browse
                <input type="file" hidden ref="inputBrowse" @change="selectedFile($event)" accept="image/*" />
              </v-btn>
            </v-col>

            <v-col>
              <v-btn
                color="green darken-1"
                avatar
                text
                @click="clear"
                :disabled="isDisabled || !(avatarData || curAvatarUrl)"
                data-testid="btn-action-clear"
                >Clear</v-btn
              >
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions>
        <!-- Move the buttons to the right -->
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="close">Cancel</v-btn>
        <v-btn
          color="green darken-1"
          text
          @click="update"
          :disabled="isDisabled || !isTouched"
          data-testid="btn-action-update"
          >Update</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import * as avatars from '@/services/avatars';
import { playSound, SNAPSHOT } from '@/lib/audio';

const AVATAR_WIDTH = 100;
const AVATAR_HEIGHT = 100;
const avatarConstraints = {
  video: { width: { exact: AVATAR_WIDTH }, height: { exact: AVATAR_HEIGHT } },
  audio: false
};

export default {
  props: {
    user: {
      type: Object,
      required: false
    },
    show: {
      type: Boolean,
      required: true
    }
  },
  // use the 'show' property for v-model
  model: {
    prop: 'show',
    event: 'close'
  },
  data() {
    return {
      isDisabled: true,
      isTouched: false,
      curAvatarUrl: null,
      avatarData: null,

      videoCaptureStream: null
    };
  },
  computed: {
    avatarWidth() {
      return AVATAR_WIDTH;
    },
    avatarHeigth() {
      return AVATAR_HEIGHT;
    },
    canCapture() {
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }
  },
  watch: {
    show() {
      if (this.show) {
        // when shown reset all props
        this.isDisabled = true;
        this.isTouched = false;

        this.curAvatarUrl = null;
        this.avatarData = null;

        this.videoCaptureStream = null;

        // get current
        avatars
          .getAvatar(this.user, false)
          .catch(() => null)
          .then(imageUrl => {
            // if (this.show) {
            this.isDisabled = false;
            this.curAvatarUrl = imageUrl;
            // }
          });
      } else {
        // when closed - stop the streaming
        this.stopStream();
      }
    },
    avatarData() {
      // when "new" avatar is set - either selected a file or captured from Webcam
      // then hide the current
      if (this.avatarData) {
        this.curAvatarUrl = null;
      }
    }
  },
  methods: {
    stopStream() {
      if (this.videoCaptureStream) {
        this.videoCaptureStream.getTracks().forEach(track => track.stop());
        this.videoCaptureStream = null;
      }
    },
    captureStream() {
      navigator.mediaDevices.getUserMedia(avatarConstraints).then(stream => {
        this.videoCaptureStream = stream;
        this.$refs.videoCapture.srcObject = this.videoCaptureStream;
      });
    },

    snapshotStream() {
      // pay sound
      const /* HTMLCanvasElement */ canvas = this.$refs.snapshotCapture;
      const /* CanvasRenderingContext2D */ context = canvas.getContext('2d');

      playSound(SNAPSHOT);

      // render it on the canvas - no need to scale as video and canvas are same size
      context.clearRect(0, 0, AVATAR_WIDTH, AVATAR_HEIGHT);
      context.drawImage(this.$refs.videoCapture, 0, 0);

      // get it's data for storage on update
      canvas.toBlob(blob => {
        this.avatarData = blob;
        this.isTouched = true;
      }, 'image/jpeg');

      this.stopStream();
    },

    browseFile() {
      this.stopStream();

      // show the browser's Browse dialog
      this.$refs.inputBrowse.click();
    },

    /**
     * Called when file is browsed and selected
     * @param {Event} event
     */
    selectedFile(event) {
      //this is a File Input Element
      const /*File[]*/ files = event.target.files;

      if (files.length) {
        this.avatarData = files[0];
        this.isTouched = true;

        // render it on the canvas
        const reader = new FileReader();

        reader.readAsDataURL(this.avatarData);
        reader.onloadend = event => {
          if (event.target.readyState == FileReader.DONE) {
            const image = new Image();
            image.src = event.target.result;
            image.onload = () => {
              // render it on the canvas - note the scaling
              const /* HTMLCanvasElement */ canvas = this.$refs.snapshotCapture;
              const /* CanvasRenderingContext2D */ context = canvas.getContext('2d');
              context.clearRect(0, 0, AVATAR_WIDTH, AVATAR_HEIGHT);
              // TODO: it's better to do it only if the image is bigger than the canvas,
              // and if it's smaller to center it
              context.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height);
            };
          }
        };
      }
    },

    /**
     * Called when image data is
     */
    clear() {
      this.stopStream();

      this.curAvatarUrl = null;
      this.avatarData = null;
      this.isTouched = true;
    },

    /**
     * @param {Boolean} isClear
     */
    update() {
      // send event only if 'touched', e.g. most probably avatar is changed
      if (this.isTouched) this.$emit('update', { user: this.user, avatarData: this.avatarData });

      this.close();
    },

    close() {
      // close the dialog
      this.$emit('close', false);
    }
  }
};
</script>

<style scoped>
video,
img,
canvas {
  /* clear some common canvas styles from Vuetify */
  position: initial;

  /* make it round */
  border-radius: 50%;
}
</style>