export default {
  name: "GroupSetTopic",
  data() {
    return { loading: false, groupId: "", topic: "", showModal: false };
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
        let response = await window.http.post(`/group/topic`, {
          group_id: this.groupId,
          topic: this.topic,
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
      this.topic = "";
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-group)">Group</span>
      <div class="card-title">Set Group Topic</div>
      <div class="card-desc">Set or remove group description/topic</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Set Group Topic
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
                <label class="form-label">Topic (Description)</label>
                <textarea
                  v-model="topic"
                  class="form-textarea"
                  placeholder="Enter description... Leave empty to remove."
                  rows="4"
                  aria-label="Group Topic"
                ></textarea>
                <small class="text-xs text-gray-500 mt-1 block">
                  Leave empty to remove the current topic.
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
              {{ topic.trim() === '' ? 'Remove Topic' : 'Update Topic' }}
            </button>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
