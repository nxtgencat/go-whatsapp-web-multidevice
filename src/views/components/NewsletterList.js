export default {
  name: "ListNewsletter",
  data() {
    return { newsletters: [], showModal: false, loading: false };
  },
  methods: {
    async openModal() {
      this.showModal = true;
      try {
        this.loading = true;
        await this.submitApi();
        showSuccessInfo("Newsletters fetched");
      } catch (err) {
        showErrorInfo(err);
      } finally {
        this.loading = false;
      }
    },
    closeModal() {
      this.showModal = false;
    },
    async handleUnfollowNewsletter(newsletter_id) {
      if (!confirm("Are you sure to leave this newsletter?")) return;
      try {
        await this.unfollowNewsletterApi(newsletter_id);
        await this.submitApi();
        showSuccessInfo("Success unfollow newsletter");
      } catch (err) {
        showErrorInfo(err);
      }
    },
    async unfollowNewsletterApi(newsletter_id) {
      try {
        await window.http.post(`/newsletter/unfollow`, { newsletter_id });
      } catch (error) {
        if (error.response) throw new Error(error.response.data.message);
        throw new Error(error.message);
      }
    },
    async submitApi() {
      try {
        let response = await window.http.get(`/user/my/newsletters`);
        this.newsletters = response.data.results.data;
      } catch (error) {
        if (error.response) throw new Error(error.response.data.message);
        throw new Error(error.message);
      }
    },
    formatDate(value) {
      if (!value) return "";
      if (isNaN(value)) return "Invalid date";
      return new Date(value * 1000).toLocaleString();
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-newsletter)">Newsletter</span>
      <div class="card-title">List Newsletters</div>
      <div class="card-desc">Display all your newsletters</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box large">
          <div class="modal-header">
            My Newsletter List
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <div v-if="loading" class="loader-center"><div class="loader"></div></div>
            <div v-else-if="!newsletters || !newsletters.length" class="msg-box info">
              No newsletters found.
            </div>
            <div v-else class="overflow-x-auto">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Newsletter ID</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Created At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="n in newsletters" :key="n.id">
                    <td class="text-xs font-mono">{{ n.id.split('@')[0] }}</td>
                    <td>{{ n.thread_metadata?.name?.text || 'N/A' }}</td>
                    <td>{{ n.viewer_metadata?.role || 'N/A' }}</td>
                    <td class="text-xs">{{ formatDate(n.thread_metadata?.creation_time) }}</td>
                    <td>
                      <button class="btn btn-sm btn-danger" @click="handleUnfollowNewsletter(n.id)">
                        Unfollow
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
