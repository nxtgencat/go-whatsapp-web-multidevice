export default {
  name: "AccountPrivacy",
  data() {
    return { data_privacy: null, showModal: false };
  },
  methods: {
    async openModal() {
      try {
        await this.submitApi();
        this.showModal = true;
        showSuccessInfo("Privacy fetched");
      } catch (err) {
        showErrorInfo(err);
      }
    },
    closeModal() {
      this.showModal = false;
    },
    async submitApi() {
      try {
        let response = await window.http.get(`/user/my/privacy`);
        this.data_privacy = response.data.results;
      } catch (error) {
        if (error.response) throw new Error(error.response.data.message);
        throw new Error(error.message);
      }
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-account)">Account</span>
      <div class="card-title">My Privacy Setting</div>
      <div class="card-desc">Get your privacy settings</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            My Privacy
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <div v-if="data_privacy" class="space-y-3">
              <div class="flex justify-between border-b border-gray-200 pb-2">
                <span class="text-sm font-bold">Group Add</span>
                <span class="text-sm">{{ data_privacy.group_add }}</span>
              </div>
              <div class="flex justify-between border-b border-gray-200 pb-2">
                <span class="text-sm font-bold">Last Seen</span>
                <span class="text-sm">{{ data_privacy.last_seen }}</span>
              </div>
              <div class="flex justify-between border-b border-gray-200 pb-2">
                <span class="text-sm font-bold">Status</span>
                <span class="text-sm">{{ data_privacy.status }}</span>
              </div>
              <div class="flex justify-between border-b border-gray-200 pb-2">
                <span class="text-sm font-bold">Profile</span>
                <span class="text-sm">{{ data_privacy.profile }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm font-bold">Read Receipts</span>
                <span class="text-sm">{{ data_privacy.read_receipts }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
