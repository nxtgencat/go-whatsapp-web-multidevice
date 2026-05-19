import FormRecipient from "./generic/FormRecipient.js";

export default {
  name: "AccountBusinessProfile",
  components: { FormRecipient },
  data() {
    return {
      type: window.TYPEUSER,
      phone: "",
      jid: null,
      email: null,
      address: null,
      categories: [],
      profileOptions: {},
      businessHoursTimeZone: null,
      businessHours: [],
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
        showSuccessInfo("Business profile fetched");
      } catch (err) {
        showErrorInfo(err);
      }
    },
    async submitApi() {
      this.loading = true;
      try {
        let response = await window.http.get(
          `/user/business-profile?phone=${this.phone_id}`,
        );
        const results = response.data.results;
        this.jid = results.jid;
        this.email = results.email;
        this.address = results.address;
        this.categories = results.categories || [];
        this.profileOptions = results.profile_options || {};
        this.businessHoursTimeZone = results.business_hours_timezone;
        this.businessHours = results.business_hours || [];
      } catch (error) {
        if (error.response) {
          const msg = error.response.data.message;
          if (msg.includes("not be a business account"))
            throw new Error("Not a WhatsApp Business account.");
          else if (msg.includes("corrupted"))
            throw new Error("Profile data corrupted.");
          else throw new Error(msg);
        } else throw new Error("Failed to fetch profile.");
      } finally {
        this.loading = false;
      }
    },
    handleReset() {
      this.phone = "";
      this.jid = null;
      this.email = null;
      this.address = null;
      this.categories = [];
      this.profileOptions = {};
      this.businessHoursTimeZone = null;
      this.businessHours = [];
      this.type = window.TYPEUSER;
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-account)">Account</span>
      <div class="card-title">Business Profile</div>
      <div class="card-desc">Get detailed business profile information</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box large">
          <div class="modal-header">
            Business Profile Information
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <div class="msg-box info mb-4">
              <p class="text-sm">
                Only works with WhatsApp Business accounts that have a public profile.
              </p>
            </div>
            <FormRecipient v-model:type="type" v-model:phone="phone" />
            <button
              type="button"
              class="btn btn-primary mb-4"
              :class="{'btn-loading': loading}"
              :disabled="!isValidForm() || loading"
              @click.prevent="handleSubmit"
            >
              Get Business Profile
            </button>
            <div v-if="jid" class="border-2 border-gray-900 p-4 space-y-3 mt-4">
              <h4 class="font-bold text-sm uppercase tracking-wider">Profile Details</h4>
              <div class="text-sm">
                <strong>JID:</strong>
                {{ jid }}
              </div>
              <div v-if="email" class="text-sm">
                <strong>Email:</strong>
                {{ email }}
              </div>
              <div v-if="address" class="text-sm">
                <strong>Address:</strong>
                {{ address }}
              </div>
              <div v-if="categories.length > 0" class="text-sm">
                <strong>Categories:</strong>
                <span
                  v-for="c in categories"
                  :key="c.id"
                  class="inline-block text-xs font-bold px-2 py-1 mr-1 border-2 border-gray-900 bg-gray-100"
                >
                  {{ c.name }}
                </span>
              </div>
              <div v-if="businessHoursTimeZone" class="text-sm">
                <strong>Timezone:</strong>
                {{ businessHoursTimeZone }}
              </div>
              <div v-if="businessHours.length > 0">
                <strong class="text-sm">Business Hours:</strong>
                <div v-for="h in businessHours" :key="h.day_of_week" class="text-xs ml-4 text-gray-600">
                  <strong>{{ h.day_of_week.charAt(0).toUpperCase() + h.day_of_week.slice(1) }}:</strong>
                  {{ h.open_time }} - {{ h.close_time }} ({{ h.mode }})
                </div>
              </div>
              <div v-if="Object.keys(profileOptions).length > 0">
                <strong class="text-sm">Profile Options:</strong>
                <div
                  v-for="(value, key) in profileOptions"
                  :key="key"
                  class="text-xs ml-4 text-gray-600"
                >
                  <strong>{{ key }}:</strong>
                  {{ value }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
