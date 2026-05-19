export default {
  name: "GroupInfoFromLink",
  data() {
    return { loading: false, link: "", groupInfo: null, showModal: false };
  },
  methods: {
    openModal() {
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
      this.handleReset();
    },
    isValidForm() {
      if (!this.link.trim()) return false;
      try {
        const url = new URL(this.link);
        if (
          !url.hostname.includes("chat.whatsapp.com") ||
          !url.pathname.includes("/")
        )
          return false;
      } catch {
        return false;
      }
      return true;
    },
    async handleSubmit() {
      if (!this.isValidForm() || this.loading) return;
      try {
        let r = await this.submitApi();
        this.groupInfo = r.results;
        showSuccessInfo("Group info retrieved");
      } catch (err) {
        showErrorInfo(err);
      }
    },
    async submitApi() {
      this.loading = true;
      try {
        let response = await window.http.get(
          `/group/info-from-link?link=${encodeURIComponent(this.link)}`,
        );
        return response.data;
      } catch (error) {
        if (error.response) throw new Error(error.response.data.message);
        throw new Error(error.message);
      } finally {
        this.loading = false;
      }
    },
    handleReset() {
      this.link = "";
      this.groupInfo = null;
    },
    formatDate(d) {
      if (!d) return "N/A";
      return new Date(d).toLocaleString();
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-group)">Group</span>
      <div class="card-title">Group Preview</div>
      <div class="card-desc">Get group info from invitation link</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Group Information Preview
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Invitation Link</label>
              <input
                v-model="link"
                type="text"
                class="form-input"
                placeholder="https://chat.whatsapp.com/..."
                aria-label="Invitation Link"
              />
            </div>
            <div v-if="groupInfo" class="border-2 border-gray-900 p-4 mt-4 space-y-3">
              <h4 class="font-bold text-sm uppercase tracking-wider">Group Details</h4>
              <div class="text-sm">
                <strong>Name:</strong>
                {{ groupInfo.name || 'N/A' }}
              </div>
              <div class="text-sm">
                <strong>Group ID:</strong>
                <code class="code-tag">{{ groupInfo.group_id || 'N/A' }}</code>
              </div>
              <div class="text-sm">
                <strong>Topic:</strong>
                {{ groupInfo.topic || 'No topic set' }}
              </div>
              <div class="text-sm">
                <strong>Description:</strong>
                {{ groupInfo.description || 'No description' }}
              </div>
              <div class="text-sm">
                <strong>Created At:</strong>
                {{ formatDate(groupInfo.created_at) }}
              </div>
              <div class="text-sm">
                <strong>Participants:</strong>
                {{ groupInfo.participant_count || 0 }} members
              </div>
              <div class="flex gap-2 flex-wrap mt-2">
                <span
                  class="text-xs font-bold px-2 py-1 border-2 border-gray-900"
                  :class="groupInfo.is_locked ? 'bg-red-100' : 'bg-green-100'"
                >
                  {{ groupInfo.is_locked ? 'Locked' : 'Unlocked' }}
                </span>
                <span
                  class="text-xs font-bold px-2 py-1 border-2 border-gray-900"
                  :class="groupInfo.is_announce ? 'bg-orange-100' : 'bg-blue-100'"
                >
                  {{ groupInfo.is_announce ? 'Announce' : 'Regular' }}
                </span>
                <span
                  class="text-xs font-bold px-2 py-1 border-2 border-gray-900"
                  :class="groupInfo.is_ephemeral ? 'bg-purple-100' : 'bg-gray-100'"
                >
                  {{ groupInfo.is_ephemeral ? ' Disappearing' : ' Regular' }}
                </span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="closeModal">Close</button>
            <button
              class="btn btn-primary"
              :class="{'btn-loading': loading}"
              :disabled="!isValidForm() || loading"
              @click.prevent="handleSubmit"
            >
              Get Info
            </button>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
