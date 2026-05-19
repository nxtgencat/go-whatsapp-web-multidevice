export default {
  name: "AccountContact",
  data() {
    return { contacts: [], showModal: false, loading: false };
  },
  methods: {
    async openModal() {
      this.showModal = true;
      try {
        this.loading = true;
        await this.submitApi();
        showSuccessInfo("Contacts fetched");
      } catch (err) {
        showErrorInfo(err);
      } finally {
        this.loading = false;
      }
    },
    closeModal() {
      this.showModal = false;
    },
    async submitApi() {
      try {
        let response = await window.http.get(`/user/my/contacts`);
        this.contacts = response.data.results.data;
      } catch (error) {
        if (error.response) throw new Error(error.response.data.message);
        throw new Error(error.message);
      }
    },
    getPhoneNumber(jid) {
      return jid.split("@")[0];
    },
    exportToCSV() {
      if (!this.contacts || !this.contacts.length) {
        showErrorInfo("No contacts to export");
        return;
      }
      let csvContent = "Phone Number,Name\n";
      this.contacts.forEach((c) => {
        const phone = this.getPhoneNumber(c.jid);
        const name = c.name ? c.name.replace(/"/g, '""') : "";
        csvContent += `${phone},"${name}"\n`;
      });
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "contacts.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccessInfo("Contacts exported to CSV");
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-account)">Account</span>
      <div class="card-title">My Contacts</div>
      <div class="card-desc">Display all your contacts</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box large">
          <div class="modal-header">
            My Contacts
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <button class="btn btn-sm btn-primary" @click="exportToCSV">Export CSV</button>
            </div>
            <div v-if="loading" class="loader-center"><div class="loader"></div></div>
            <div v-else-if="!contacts || !contacts.length" class="msg-box info">No contacts found.</div>
            <div v-else class="overflow-x-auto">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Phone Number</th>
                    <th>Name</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="c in contacts" :key="c.jid">
                    <td class="text-xs font-mono">{{ getPhoneNumber(c.jid) }}</td>
                    <td>{{ c.name }}</td>
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
