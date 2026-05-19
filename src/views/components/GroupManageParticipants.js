export default {
  name: "ManageGroupParticipants",
  data() {
    return {
      loading: false,
      group: "",
      action: "add",
      participants: ["", ""],
      showModal: false,
    };
  },
  computed: {
    group_id() {
      return `${this.group}${window.TYPEGROUP}`;
    },
  },
  methods: {
    openModal() {
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    isValidForm() {
      if (
        this.participants.length < 1 ||
        this.participants.every((p) => this.isEmpty(p))
      )
        return false;
      return true;
    },
    isEmpty(value) {
      return !String(value?.jid ?? value).trim();
    },
    handleAddParticipant() {
      this.participants.push("");
    },
    handleDeleteParticipant(i) {
      this.participants.splice(i, 1);
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
        const payload = {
          group_id: this.group_id,
          participants: this.participants
            .filter((p) => !this.isEmpty(p))
            .map((p) => `${p?.jid ?? p}`),
        };
        let response;
        switch (this.action) {
          case "add":
            response = await window.http.post(`/group/participants`, payload);
            break;
          case "remove":
            response = await window.http.post(
              `/group/participants/remove`,
              payload,
            );
            break;
          case "promote":
            response = await window.http.post(
              `/group/participants/promote`,
              payload,
            );
            break;
          case "demote":
            response = await window.http.post(
              `/group/participants/demote`,
              payload,
            );
            break;
        }
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
      this.group = "";
      this.action = "add";
      this.participants = ["", ""];
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-group)">Group</span>
      <div class="card-title">Manage Participants</div>
      <div class="card-desc">Add/Remove/Promote/Demote Participants</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Manage Participants
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleSubmit">
              <div class="form-group">
                <label class="form-label">Group ID</label>
                <input
                  v-model="group"
                  type="text"
                  class="form-input"
                  placeholder="12036322888236XXXX..."
                  aria-label="Group ID"
                />
                <input
                  :value="group_id"
                  disabled
                  class="form-input mt-2 text-sm opacity-60"
                  aria-label="whatsapp_id"
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
                  <button type="button" class="btn btn-sm btn-ghost" @click="handleAddParticipant">
                    + Add
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Action</label>
                <select v-model="action" class="form-select" aria-label="Action">
                  <option value="add">Add to group</option>
                  <option value="remove">Remove from group</option>
                  <option value="promote">Promote to admin</option>
                  <option value="demote">Demote from admin</option>
                </select>
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
              Submit
            </button>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
