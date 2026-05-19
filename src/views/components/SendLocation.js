import FormRecipient from "./generic/FormRecipient.js";

export default {
  name: "SendLocation",
  components: { FormRecipient },
  data() {
    return {
      type: window.TYPEUSER,
      phone: "",
      latitude: "",
      longitude: "",
      loading: false,
      is_forwarded: false,
      duration: 0,
      showModal: false,
    };
  },
  computed: {
    phone_id() {
      return this.phone + this.type;
    },
    isValidForm() {
      const isPhoneValid =
        this.type === window.TYPESTATUS || this.phone.trim().length > 0;
      const isLatitudeValid =
        !isNaN(this.latitude) &&
        parseFloat(this.latitude) >= -90 &&
        parseFloat(this.latitude) <= 90;
      const isLongitudeValid =
        !isNaN(this.longitude) &&
        parseFloat(this.longitude) >= -180 &&
        parseFloat(this.longitude) <= 180;
      return isPhoneValid && isLatitudeValid && isLongitudeValid;
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
    async handleSubmit() {
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
        const payload = {
          phone: this.phone_id,
          latitude: this.latitude,
          longitude: this.longitude,
          is_forwarded: this.is_forwarded,
          ...(this.duration && this.duration > 0
            ? { duration: this.duration }
            : {}),
        };
        const response = await window.http.post(`/send/location`, payload);
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
      this.latitude = "";
      this.longitude = "";
      this.type = window.TYPEUSER;
      this.is_forwarded = false;
      this.duration = 0;
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-send)">Send</span>
      <div class="card-title">Send Location</div>
      <div class="card-desc">Send location to user or group</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Send Location
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleSubmit">
              <FormRecipient v-model:type="type" v-model:phone="phone" />
              <div class="form-group">
                <label class="form-label">Latitude</label>
                <input
                  v-model="latitude"
                  type="text"
                  class="form-input"
                  placeholder="-90 to 90"
                  aria-label="latitude"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Longitude</label>
                <input
                  v-model="longitude"
                  type="text"
                  class="form-input"
                  placeholder="-180 to 180"
                  aria-label="longitude"
                />
              </div>
              <div class="form-group" v-if="isShowAttributes()">
                <label class="toggle-wrap">
                  <span
                    class="toggle-track"
                    :class="{active: is_forwarded}"
                    @click="is_forwarded = !is_forwarded"
                  ></span>
                  <span class="toggle-label">Mark location as forwarded</span>
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
            </form>
          </div>
          <div class="modal-footer">
            <button
              class="btn btn-primary"
              :class="{'btn-loading': loading}"
              :disabled="!isValidForm"
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
