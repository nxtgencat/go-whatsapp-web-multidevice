import FormRecipient from "./generic/FormRecipient.js";

export default {
  name: "SendAudio",
  components: { FormRecipient },
  data() {
    return {
      phone: "",
      type: window.TYPEUSER,
      loading: false,
      selectedFileName: null,
      is_forwarded: false,
      audio_url: null,
      duration: 0,
      ptt: false,
      showModal: false,
    };
  },
  computed: {
    phone_id() {
      return this.phone + this.type;
    },
  },
  methods: {
    openModal() {
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    isValidForm() {
      if (this.type !== window.TYPEUSER && !this.phone.trim()) return false;
      if (!this.selectedFileName && !this.audio_url) return false;
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
        payload.append("is_forwarded", this.is_forwarded);
        payload.append("ptt", this.ptt);
        if (this.duration && this.duration > 0)
          payload.append("duration", this.duration);
        const fi = this.$refs.fileAudio;
        if (fi && fi.files.length > 0) payload.append("audio", fi.files[0]);
        if (this.audio_url) payload.append("audio_url", this.audio_url);
        const response = await window.http.post(`/send/audio`, payload);
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
      this.phone = "";
      this.type = window.TYPEUSER;
      this.is_forwarded = false;
      this.duration = 0;
      this.ptt = false;
      this.selectedFileName = null;
      this.audio_url = null;
      if (this.$refs.fileAudio) this.$refs.fileAudio.value = "";
    },
    handleFileChange(event) {
      const f = event.target.files[0];
      if (f) this.selectedFileName = f.name;
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-send)">Send</span>
      <div class="card-title">Send Audio</div>
      <div class="card-desc">Send audio to user or group</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Send Audio
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleSubmit">
              <FormRecipient v-model:type="type" v-model:phone="phone" />
              <div class="form-group">
                <label class="toggle-wrap">
                  <span
                    class="toggle-track"
                    :class="{active: is_forwarded}"
                    @click="is_forwarded = !is_forwarded"
                  ></span>
                  <span class="toggle-label">Mark audio as forwarded</span>
                </label>
              </div>
              <div class="form-group">
                <label class="toggle-wrap">
                  <span class="toggle-track" :class="{active: ptt}" @click="ptt = !ptt"></span>
                  <span class="toggle-label">Send as voice note (required for OGG/Opus)</span>
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
                <label class="form-label">Audio URL</label>
                <input
                  type="text"
                  v-model="audio_url"
                  class="form-input"
                  placeholder="https://example.com/audio.mp3"
                  aria-label="audio_url"
                />
              </div>
              <div class="text-sm font-bold my-3">or upload audio from your device</div>
              <div class="form-group">
                <input
                  type="file"
                  ref="fileAudio"
                  class="hidden"
                  accept="audio/*"
                  @change="handleFileChange"
                />
                <label class="upload-btn" @click="$refs.fileAudio.click()">Upload</label>
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
