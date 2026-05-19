import FormRecipient from "./generic/FormRecipient.js";

export default {
  name: "SendSticker",
  components: { FormRecipient },
  data() {
    return {
      phone: "",
      type: window.TYPEUSER,
      loading: false,
      selected_file: null,
      sticker_url: null,
      preview_url: null,
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
      if (!this.selected_file && !this.sticker_url) return false;
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
        if (this.duration && this.duration > 0)
          payload.append("duration", this.duration);
        const fi = this.$refs.fileSticker;
        if (fi && fi.files.length > 0) payload.append("sticker", fi.files[0]);
        if (this.sticker_url) payload.append("sticker_url", this.sticker_url);
        let response = await window.http.post(`/send/sticker`, payload);
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
      this.preview_url = null;
      this.selected_file = null;
      this.sticker_url = null;
      this.is_forwarded = false;
      this.duration = 0;
      if (this.$refs.fileSticker) this.$refs.fileSticker.value = "";
    },
    handleStickerChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.preview_url = URL.createObjectURL(file);
        this.selected_file = file.name;
      }
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-send)">Send</span>
      <div class="card-title">Send Sticker</div>
      <div class="card-desc">
        Send sticker with auto conversion to WebP
        <span class="card-tag">jpg/png/webp/gif</span>
      </div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Send Sticker
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleSubmit">
              <FormRecipient v-model:type="type" v-model:phone="phone" :show-status="true" />
              <div class="msg-box info mb-4">
                <div class="msg-title">Sticker Info</div>
                <ul class="list-disc list-inside text-sm space-y-1 mt-1">
                  <li>Auto converted to WebP format</li>
                  <li>Max 512x512 pixels (auto resizing)</li>
                  <li>Supports JPG, PNG, WebP, GIF</li>
                  <li>Transparent backgrounds preserved</li>
                </ul>
              </div>
              <div class="form-group" v-if="isShowAttributes()">
                <label class="toggle-wrap">
                  <span
                    class="toggle-track"
                    :class="{active: is_forwarded}"
                    @click="is_forwarded = !is_forwarded"
                  ></span>
                  <span class="toggle-label">Mark sticker as forwarded</span>
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
                <label class="form-label">Sticker URL</label>
                <input
                  type="text"
                  v-model="sticker_url"
                  class="form-input"
                  placeholder="https://example.com/sticker.png"
                  aria-label="sticker_url"
                />
              </div>
              <div class="text-sm font-bold my-3">or upload sticker from your device</div>
              <div class="form-group">
                <input
                  type="file"
                  ref="fileSticker"
                  class="hidden"
                  accept="image/png,image/jpg,image/jpeg,image/webp,image/gif"
                  @change="handleStickerChange"
                />
                <label class="upload-btn" @click="$refs.fileSticker.click()">Upload sticker</label>
                <div v-if="preview_url" class="mt-3">
                  <img :src="preview_url" class="preview-image" />
                </div>
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
