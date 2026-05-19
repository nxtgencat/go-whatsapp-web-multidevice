import FormRecipient from "./generic/FormRecipient.js";

export default {
  name: "SendVideo",
  components: { FormRecipient },
  props: { maxVideoSize: { type: String, required: true } },
  data() {
    return {
      caption: "",
      view_once: false,
      compress: false,
      gif_playback: false,
      type: window.TYPEUSER,
      phone: "",
      loading: false,
      video_url: null,
      selectedFileName: null,
      is_forwarded: false,
      duration: 0,
      showModal: false,
    };
  },
  computed: {
    phone_id() {
      return this.phone + this.type;
    },
  },
  watch: {
    view_once(v) {
      if (v) {
        this.is_forwarded = false;
        this.duration = 0;
      }
    },
  },
  methods: {
    openModal() {
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    isShowAttributes() {
      return this.type !== window.TYPESTATUS;
    },
    isValidForm() {
      if (this.type !== window.TYPESTATUS && !this.phone.trim()) return false;
      const fileInput = this.$refs.fileVideo;
      const hasFile = fileInput && fileInput.files && fileInput.files[0];
      if (!hasFile && !this.video_url) return false;
      if (hasFile && !fileInput.files[0].type.startsWith("video/"))
        return false;
      return true;
    },
    async handleSubmit() {
      if (!this.isValidForm() || this.loading) return;
      try {
        let r = await this.submitApi();
        showSuccessInfo(r);
        this.closeModal();
      } catch (err) {
        showErrorInfo(err);
      }
    },
    async submitApi() {
      this.loading = true;
      try {
        let payload = new FormData();
        payload.append("phone", this.phone_id);
        payload.append("caption", this.caption.trim());
        payload.append("view_once", this.view_once);
        payload.append("compress", this.compress);
        payload.append("gif_playback", this.gif_playback);
        payload.append("is_forwarded", this.is_forwarded);
        if (this.duration && this.duration > 0)
          payload.append("duration", this.duration);
        const fi = this.$refs.fileVideo;
        if (fi && fi.files && fi.files[0]) payload.append("video", fi.files[0]);
        if (this.video_url) payload.append("video_url", this.video_url);
        let response = await window.http.post(`/send/video`, payload);
        this.handleReset();
        return response.data.message;
      } catch (error) {
        if (error.response) throw new Error(error.response.data.message);
        throw new Error(error.message);
      } finally {
        this.loading = false;
      }
    },
    handleReset() {
      this.caption = "";
      this.view_once = false;
      this.compress = false;
      this.gif_playback = false;
      this.phone = "";
      this.selectedFileName = null;
      this.video_url = null;
      this.is_forwarded = false;
      this.duration = 0;
      if (this.$refs.fileVideo) this.$refs.fileVideo.value = "";
    },
    handleFileChange(event) {
      const f = event.target.files[0];
      if (f) this.selectedFileName = f.name;
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-send)">Send</span>
      <div class="card-title">Send Video</div>
      <div class="card-desc">
        Send video
        <span class="card-tag">mp4</span>
        up to
        <span class="card-tag">{{ maxVideoSize }}</span>
      </div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Send Video
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleSubmit">
              <FormRecipient v-model:type="type" v-model:phone="phone" :show-status="true" />
              <div class="form-group">
                <label class="form-label">Caption</label>
                <textarea
                  v-model="caption"
                  class="form-textarea"
                  placeholder="Type some caption (optional)..."
                  aria-label="caption"
                ></textarea>
              </div>
              <div class="form-group" v-if="isShowAttributes()">
                <label class="toggle-wrap">
                  <span
                    class="toggle-track"
                    :class="{active: view_once}"
                    @click="view_once = !view_once"
                  ></span>
                  <span class="toggle-label">Enable one time view</span>
                </label>
              </div>
              <div class="form-group" v-if="isShowAttributes()">
                <label class="toggle-wrap">
                  <span
                    class="toggle-track"
                    :class="{active: compress}"
                    @click="compress = !compress"
                  ></span>
                  <span class="toggle-label">Compress video to smaller size</span>
                </label>
              </div>
              <div class="form-group" v-if="isShowAttributes()">
                <label class="toggle-wrap">
                  <span
                    class="toggle-track"
                    :class="{active: gif_playback}"
                    @click="gif_playback = !gif_playback"
                  ></span>
                  <span class="toggle-label">Display as GIF (looping, silent, autoplay)</span>
                </label>
              </div>
              <div class="form-group" v-if="isShowAttributes() && !view_once">
                <label class="toggle-wrap">
                  <span
                    class="toggle-track"
                    :class="{active: is_forwarded}"
                    @click="is_forwarded = !is_forwarded"
                  ></span>
                  <span class="toggle-label">Mark video as forwarded</span>
                </label>
              </div>
              <div class="form-group">
                <label class="form-label">Disappearing Duration (seconds)</label>
                <input
                  v-model.number="duration"
                  type="number"
                  min="0"
                  class="form-input"
                  placeholder="0 (no expiry)"
                  aria-label="duration"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Video URL</label>
                <input
                  type="text"
                  v-model="video_url"
                  class="form-input"
                  placeholder="https://example.com/sample.mp4"
                  aria-label="video_url"
                />
              </div>
              <div class="text-sm font-bold my-3" v-if="!video_url">
                or upload video from your device
              </div>
              <div class="form-group" v-if="!video_url">
                <input
                  type="file"
                  ref="fileVideo"
                  class="hidden"
                  accept="video/*"
                  @change="handleFileChange"
                />
                <label class="upload-btn" @click="$refs.fileVideo.click()">Upload video</label>
                <div v-if="selectedFileName" class="msg-box info mt-3">{{ selectedFileName }}</div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button
              class="btn btn-primary"
              :class="{'btn-loading': loading}"
              :disabled="!isValidForm() || loading"
              @click.prevent="handleSubmit"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
