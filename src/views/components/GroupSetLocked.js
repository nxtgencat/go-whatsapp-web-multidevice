export default {
  name: "GroupSetLocked",
  data() {
    return { loading: false, groupId: "", locked: false, showModal: false };
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
        let response = await window.http.post(`/group/locked`, {
          group_id: this.groupId,
          locked: this.locked,
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
      this.locked = false;
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-group)">Group</span>
      <div class="card-title">Set Group Locked</div>
      <div class="card-desc">Lock/unlock group info editing</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Set Group Locked Status
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
                  <span class="toggle-track" :class="{active: locked}" @click="locked = !locked"></span>
                  <span class="toggle-label">
                    {{ locked ? 'Lock group (only admins can edit info)' : 'Unlock group (all members can edit info)' }}
                  </span>
                </label>
                <div class="msg-box info mt-3">
                  <div class="msg-title">What does this do?</div>
                  <ul class="list-disc list-inside text-sm space-y-1 mt-1">
                    <li>
                      <strong>Locked:</strong>
                      Only admins can change group name, description, photo
                    </li>
                    <li>
                      <strong>Unlocked:</strong>
                      All members can change group info
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
              {{ locked ? 'Lock Group' : 'Unlock Group' }}
            </button>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
