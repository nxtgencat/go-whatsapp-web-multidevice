export default {
  name: "GroupSetAnnounce",
  data() {
    return { loading: false, groupId: "", announce: false, showModal: false };
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
        let response = await window.http.post(`/group/announce`, {
          group_id: this.groupId,
          announce: this.announce,
        });
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
      this.announce = false;
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-group)">Group</span>
      <div class="card-title">Set Group Announce</div>
      <div class="card-desc">Enable/disable announce mode</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Set Group Announce Mode
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
                <label class="toggle-wrap">
                  <span
                    class="toggle-track"
                    :class="{active: announce}"
                    @click="announce = !announce"
                  ></span>
                  <span class="toggle-label">
                    {{ announce ? 'Announce mode (admins only send)' : 'Regular mode (all can send)' }}
                  </span>
                </label>
                <div class="msg-box info mt-3">
                  <div class="msg-title">What does this do?</div>
                  <ul class="list-disc list-inside text-sm space-y-1 mt-1">
                    <li>
                      <strong>ON:</strong>
                      Only admins can send messages
                    </li>
                    <li>
                      <strong>OFF:</strong>
                      All members can send messages
                    </li>
                  </ul>
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
              {{ announce ? 'Enable' : 'Disable' }}
            </button>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
