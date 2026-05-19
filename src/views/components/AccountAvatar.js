import FormRecipient from "./generic/FormRecipient.js";

export default {
  name: "AccountAvatar",
  components: { FormRecipient },
  data() {
    return {
      type: window.TYPEUSER,
      phone: "",
      image: null,
      is_preview: false,
      is_community: false,
      loading: false,
      showModal: false,
    };
  },
  computed: {
    phone_id() {
      return this.phone + this.type;
    },
    isGroupType() {
      return this.type === window.TYPEGROUP;
    },
  },
  watch: {
    // Reset is_community when switching to user type (only valid for groups)
    type(newType) {
      if (newType !== window.TYPEGROUP) {
        this.is_community = false;
      }
    },
  },
  methods: {
    openModal() {
      this.handleReset();
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    isValidForm() {
      return this.phone.trim().length > 0;
    },
    async handleSubmit() {
      if (!this.isValidForm() || this.loading) return;
      try {
        await this.submitApi();
        showSuccessInfo("Avatar fetched");
      } catch (err) {
        showErrorInfo(err);
      }
    },
    async submitApi() {
      this.loading = true;
      try {
        let response = await window.http.get(
          `/user/avatar?phone=${this.phone_id}&is_preview=${this.is_preview}&is_community=${this.is_community}`,
        );
        this.image = response.data.results.url;
      } catch (error) {
        if (error.response) throw new Error(error.response.data.message);
        throw new Error(error.message);
      } finally {
        this.loading = false;
      }
    },
    handleReset() {
      this.phone = "";
      this.image = null;
      this.type = window.TYPEUSER;
      this.is_community = false;
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-account)">Account</span>
      <div class="card-title">Get Avatar</div>
      <div class="card-desc">Get user or group avatar</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Get Avatar
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleSubmit">
              <FormRecipient v-model:type="type" v-model:phone="phone" />

              <div class="form-group">
                <label class="toggle-wrap">
                  <span
                    class="toggle-track"
                    :class="{active: is_preview}"
                    @click="is_preview = !is_preview"
                  ></span>
                  <span class="toggle-label">Preview (low quality)</span>
                </label>
              </div>

              <div class="form-group" v-if="isGroupType">
                <label class="toggle-wrap">
                  <span
                    class="toggle-track"
                    :class="{active: is_community}"
                    @click="is_community = !is_community"
                  ></span>
                  <span class="toggle-label">Community group</span>
                </label>
              </div>

              <div v-if="image" class="form-group">
                <label class="form-label">Result</label>
                <img :src="image" class="preview-image" alt="profile picture" />
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
              Get Avatar
            </button>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
