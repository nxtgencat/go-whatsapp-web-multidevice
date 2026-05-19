export default {
  name: "GroupSetPhoto",
  data() {
    return {
      loading: false,
      groupId: "",
      photoFile: null,
      previewUrl: null,
      showModal: false,
    };
  },
  methods: {
    openModal() {
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    isValidForm() {
      return this.groupId.trim() !== "";
    },
    handleFileChange(event) {
      const f = event.target.files[0];
      if (f) {
        this.photoFile = f;
        const r = new FileReader();
        r.onload = (e) => {
          this.previewUrl = e.target.result;
        };
        r.readAsDataURL(f);
      }
    },
    handleRemovePhoto() {
      this.photoFile = null;
      this.previewUrl = null;
      if (this.$refs.photoInput) this.$refs.photoInput.value = "";
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
        const fd = new FormData();
        fd.append("group_id", this.groupId);
        if (this.photoFile) fd.append("photo", this.photoFile);
        let response = await window.http.post(`/group/photo`, fd);
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
      this.groupId = "";
      this.photoFile = null;
      this.previewUrl = null;
      if (this.$refs.photoInput) this.$refs.photoInput.value = "";
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-group)">Group</span>
      <div class="card-title">Set Group Photo</div>
      <div class="card-desc">Update or remove group profile picture</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Set Group Photo
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleSubmit">
              <div class="form-group">
                <label class="form-label">Group ID</label>
                <input
                  v-model="groupId"
                  type="text"
                  class="form-input"
                  placeholder="120363024512399999@g.us"
                  aria-label="Group ID"
                />
              </div>
              <div class="form-group">
                <input
                  type="file"
                  ref="photoInput"
                  class="hidden"
                  accept="image/*"
                  @change="handleFileChange"
                />
                <label class="upload-btn" @click="$refs.photoInput.click()">Upload photo</label>
                <small class="text-xs text-gray-500 block mt-1">
                  JPEG recommended. Leave empty to remove.
                </small>
              </div>
              <div v-if="previewUrl" class="form-group">
                <label class="form-label">Preview</label>
                <div class="flex items-center gap-3">
                  <img :src="previewUrl" class="w-24 h-24 object-cover border-2 border-gray-900" />
                  <button type="button" class="btn btn-sm btn-danger" @click="handleRemovePhoto">
                    Remove
                  </button>
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
              Update Photo
            </button>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
