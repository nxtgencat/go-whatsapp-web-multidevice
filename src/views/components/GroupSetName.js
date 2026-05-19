export default {
  name: "GroupSetName",
  data() {
    return { loading: false, groupId: "", name: "", showModal: false };
  },
  methods: {
    openModal() {
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    isValidForm() {
      return (
        this.groupId.trim() !== "" &&
        this.name.trim() !== "" &&
        this.name.length <= 25
      );
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
        let response = await window.http.post(`/group/name`, {
          group_id: this.groupId,
          name: this.name,
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
      this.name = "";
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-group)">Group</span>
      <div class="card-title">Set Group Name</div>
      <div class="card-desc">Change the group name/title</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Set Group Name
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
                <label class="form-label">Group Name</label>
                <input
                  v-model="name"
                  type="text"
                  class="form-input"
                  placeholder="Enter new group name..."
                  maxlength="25"
                  aria-label="Group Name"
                />
                <small class="text-xs text-gray-500 mt-1 block">
                  Max 25 characters. Current: {{ name.length }}/25
                </small>
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
              Update Name
            </button>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
