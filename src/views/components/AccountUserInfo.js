import FormRecipient from "./generic/FormRecipient.js";

export default {
  name: "AccountUserInfo",
  components: { FormRecipient },
  data() {
    return {
      type: window.TYPEUSER,
      phone: "",
      name: null,
      status: null,
      devices: [],
      resolvedPhone: null,
      resolvedLid: null,
      loading: false,
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
      this.handleReset();
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    isValidForm() {
      return this.phone.trim() !== "";
    },
    async handleSubmit() {
      if (!this.isValidForm() || this.loading) return;
      try {
        await this.submitApi();
        showSuccessInfo("Info fetched");
      } catch (err) {
        showErrorInfo(err);
      }
    },
    async submitApi() {
      this.loading = true;
      try {
        let response = await window.http.get(
          `/user/info?phone=${this.phone_id}`,
        );
        const results = response.data.results;
        const userData =
          results.data && results.data.length > 0 ? results.data[0] : null;
        if (userData) {
          this.name = userData.verified_name;
          this.status = userData.status;
          this.devices = userData.devices || [];
        }
        this.resolvedPhone = results.resolved_phone || null;
        this.resolvedLid = results.resolved_lid || null;
      } catch (error) {
        if (error.response) throw new Error(error.response.data.message);
        throw new Error(error.message);
      } finally {
        this.loading = false;
      }
    },
    handleReset() {
      this.phone = "";
      this.name = null;
      this.status = null;
      this.devices = [];
      this.resolvedPhone = null;
      this.resolvedLid = null;
      this.type = window.TYPEUSER;
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-account)">Account</span>
      <div class="card-title">User Info</div>
      <div class="card-desc">Search user info by phone or LID</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Search User Information
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <FormRecipient v-model:type="type" v-model:phone="phone" />
            <button
              type="button"
              class="btn btn-primary mb-4"
              :class="{'btn-loading': loading}"
              :disabled="!isValidForm() || loading"
              @click.prevent="handleSubmit"
            >
              Search
            </button>
            <div
              v-if="devices.length > 0 || resolvedPhone || resolvedLid"
              class="border-2 border-gray-900 p-4 space-y-3"
            >
              <div v-if="resolvedPhone" class="text-sm">
                <strong>Resolved Phone:</strong>
                {{ resolvedPhone }}
              </div>
              <div v-if="resolvedLid" class="text-sm">
                <strong>Resolved LID:</strong>
                {{ resolvedLid }}
              </div>
              <div v-if="name" class="text-sm">
                <strong>Name:</strong>
                {{ name }}
              </div>
              <div v-if="status" class="text-sm">
                <strong>Status:</strong>
                {{ status }}
              </div>
              <div v-if="devices.length > 0" class="text-sm">
                <strong>Devices ({{ devices.length }}):</strong>
                <div v-for="d in devices" :key="d.AD" class="ml-4 text-xs text-gray-600">
                  {{ d.Device }} - {{ d.AD }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
