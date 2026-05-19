import FormRecipient from "./generic/FormRecipient.js";

export default {
  name: "SendImage",
  components: {
    FormRecipient,
  },
  data() {
    return {
      phone: "",
      view_once: false,
      compress: false,
      caption: "",
      type: window.TYPEUSER,
      loading: false,
      selected_file: null,
      image_url: null,
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
  watch: {
    view_once(newValue) {
      if (newValue === true) {
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
      if (this.type !== window.TYPESTATUS && !this.phone.trim()) {
        return false;
      }
      if (!this.selected_file && !this.image_url) {
        return false;
      }
      return true;
    },
    async handleSubmit() {
      if (!this.isValidForm() || this.loading) {
        return;
      }
      try {
        let response = await this.submitApi();
        showSuccessInfo(response);
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
        payload.append("view_once", this.view_once);
        payload.append("compress", this.compress);
        payload.append("caption", this.caption);
        payload.append("is_forwarded", this.is_forwarded);
        if (this.duration && this.duration > 0) {
          payload.append("duration", this.duration);
        }

        const fileInput = this.$refs.fileImage;
        if (fileInput && fileInput.files.length > 0) {
          payload.append("image", fileInput.files[0]);
        }
        if (this.image_url) {
          payload.append("image_url", this.image_url);
        }

        let response = await window.http.post(`/send/image`, payload);
        this.handleReset();
        return response.data.message;
      } catch (error) {
        if (error.response) {
          throw new Error(error.response.data.message);
        }
        throw new Error(error.message);
      } finally {
        this.loading = false;
      }
    },
    handleReset() {
      this.view_once = false;
      this.compress = false;
      this.phone = "";
      this.caption = "";
      this.preview_url = null;
      this.selected_file = null;
      this.image_url = null;
      this.is_forwarded = false;
      this.duration = 0;
      if (this.$refs.fileImage) this.$refs.fileImage.value = "";
    },
    handleImageChange(event) {
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
      <div class="card-title">Send Image</div>
      <div class="card-desc">
        Send image with
        <span class="card-tag">jpg/jpeg/png</span>
        type
      </div>
    </div>

    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Send Image
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
                  placeholder="Hello this is image caption"
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
                  <span class="toggle-label">Compress image to smaller size</span>
                </label>
              </div>
              <div class="form-group" v-if="isShowAttributes() && !view_once">
                <label class="toggle-wrap">
                  <span
                    class="toggle-track"
                    :class="{active: is_forwarded}"
                    @click="is_forwarded = !is_forwarded"
                  ></span>
                  <span class="toggle-label">Mark image as forwarded</span>
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
                <label class="form-label">Image URL</label>
                <input
                  type="text"
                  v-model="image_url"
                  class="form-input"
                  placeholder="https://example.com/image.jpg"
                  aria-label="image_url"
                />
              </div>
              <div class="text-sm font-bold my-3">or upload image from your device</div>
              <div class="form-group">
                <input
                  type="file"
                  ref="fileImage"
                  class="hidden"
                  accept="image/png,image/jpg,image/jpeg"
                  @change="handleImageChange"
                />
                <label class="upload-btn" @click="$refs.fileImage.click()">Upload image</label>
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
