export default {
  name: "CreateGroup",
  data() {
    return {
      loading: false,
      title: "",
      participants: ["", ""],
      showModal: false,
    };
  },
  methods: {
    openModal() {
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    isValidForm() {
      if (!String(this.title ?? "").trim()) return false;
      if (
        this.participants.length < 1 ||
        this.participants.every((p) => this.isEmpty(p))
      )
        return false;
      return true;
    },
    isEmpty(value) {
      const str = String(value?.jid ?? value).trim();
      return !str;
    },
    handleAddParticipant() {
      this.participants.push("");
    },
    handleDeleteParticipant(index) {
      this.participants.splice(index, 1);
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
        let response = await window.http.post(`/group`, {
          title: this.title,
          participants: this.participants
            .filter((p) => !this.isEmpty(p))
            .map((p) => `${p?.jid ?? p}`),
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
      this.title = "";
      this.participants = ["", ""];
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-group)">Group</span>
      <div class="card-title">Create Groups</div>
      <div class="card-desc">Add more friends to your group</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Create Group
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleSubmit">
              <div class="form-group">
                <label class="form-label">Group Name</label>
                <input
                  v-model="title"
                  type="text"
                  class="form-input"
                  placeholder="Group Name..."
                  aria-label="Group Name"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Participants</label>
                <div class="space-y-2">
                  <div v-for="(p, i) in participants" :key="i" class="flex gap-2">
                    <input
                      type="number"
                      class="form-input"
                      placeholder="Phone (6289...)"
                      v-model="participants[i]"
                      aria-label="participant"
                    />
                    <button
                      type="button"
                      class="btn btn-sm btn-danger"
                      @click="handleDeleteParticipant(i)"
                    >
                      -
                    </button>
                  </div>
                  <small class="text-xs text-gray-500 block">You are automatically included.</small>
                  <button type="button" class="btn btn-sm btn-ghost" @click="handleAddParticipant">
                    + Add Participant
                  </button>
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
              Create
            </button>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
