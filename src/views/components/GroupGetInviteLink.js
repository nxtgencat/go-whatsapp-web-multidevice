export default {
  name: "GroupGetInviteLink",
  data() {
    return {
      group_id: "",
      inviteLink: "",
      resetLink: false,
      loading: false,
      copying: false,
      showModal: false,
    };
  },
  computed: {
    fullGroupID() {
      if (!this.group_id) return "";
      return this.group_id.endsWith(window.TYPEGROUP)
        ? this.group_id
        : this.group_id + window.TYPEGROUP;
    },
    isValidForm() {
      return this.group_id.trim() !== "";
    },
    displayGroupID() {
      return this.fullGroupID;
    },
  },
  methods: {
    openModal() {
      this.reset();
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    async handleSubmit() {
      if (!this.isValidForm || this.loading) return;
      try {
        await this.getInviteLink();
        if (this.inviteLink) showSuccessInfo("Invite link fetched!");
        else showErrorInfo("No link received");
      } catch (err) {
        showErrorInfo(err.message || err);
      }
    },
    async getInviteLink() {
      this.loading = true;
      try {
        const response = await window.http.get(
          `/group/invite-link?group_id=${encodeURIComponent(this.fullGroupID)}&reset=${this.resetLink}`,
        );
        if (response.data.results?.invite_link)
          this.inviteLink = response.data.results.invite_link;
        else if (typeof response.data.results === "string")
          this.inviteLink = response.data.results;
        else this.inviteLink = "";
      } catch (error) {
        if (error.response)
          throw new Error(error.response.data.message || error.response.data);
        throw new Error(error.message);
      } finally {
        this.loading = false;
      }
    },
    reset() {
      this.group_id = "";
      this.inviteLink = "";
      this.resetLink = false;
      this.loading = false;
      this.copying = false;
    },
    async copyToClipboard() {
      if (!this.inviteLink) {
        showErrorInfo("No link to copy");
        return;
      }
      this.copying = true;
      try {
        await navigator.clipboard.writeText(this.inviteLink);
        showSuccessInfo("Copied!");
      } catch {
        try {
          const t = document.createElement("input");
          t.style.position = "absolute";
          t.style.left = "-9999px";
          t.value = this.inviteLink;
          document.body.appendChild(t);
          t.select();
          document.execCommand("copy");
          document.body.removeChild(t);
          showSuccessInfo("Copied!");
        } catch {
          showErrorInfo("Failed to copy");
        }
      } finally {
        this.copying = false;
      }
    },
    handleGroupIDInput() {
      const input = this.group_id.trim();
      if (input && !input.includes("@") && !input.includes("g.us"))
        this.group_id = input + window.TYPEGROUP;
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-group)">Group</span>
      <div class="card-title">Get Invite Link</div>
      <div class="card-desc">Get invite link for a group</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Get Group Invite Link
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleSubmit">
              <div class="form-group">
                <label class="form-label">Group ID</label>
                <input
                  type="text"
                  v-model="group_id"
                  class="form-input"
                  placeholder="Enter group ID (e.g., 120363419080717833)"
                  @blur="handleGroupIDInput"
                  @input="handleGroupIDInput"
                />
                <small class="text-xs text-gray-500 mt-1 block">
                  Just numbers will auto-append @g.us
                </small>
              </div>
              <div class="form-group">
                <label class="toggle-wrap">
                  <span
                    class="toggle-track"
                    :class="{active: resetLink}"
                    @click="resetLink = !resetLink"
                  ></span>
                  <span class="toggle-label">Reset invite link (revoke old link)</span>
                </label>
              </div>
              <hr class="border-t-2 border-gray-900 my-4" />
              <div v-if="inviteLink" class="form-group">
                <label class="form-label">Invite Link</label>
                <div class="flex gap-2">
                  <input
                    type="text"
                    :value="inviteLink"
                    readonly
                    class="form-input font-mono text-sm bg-gray-50"
                    @click="$event.target.select()"
                  />
                  <button
                    type="button"
                    class="btn btn-dark"
                    :class="{'btn-loading': copying}"
                    @click="copyToClipboard"
                  >
                    Copy
                  </button>
                </div>
                <div class="msg-box success mt-3">
                  <div class="msg-title">Link Generated</div>
                  <p class="text-sm">Share this link to invite others to the group.</p>
                </div>
              </div>
              <button
                type="button"
                class="btn btn-primary"
                :class="{'btn-loading': loading}"
                :disabled="!isValidForm || loading"
                @click.prevent="handleSubmit"
              >
                {{ loading ? 'Fetching...' : 'Get Invite Link' }}
              </button>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="closeModal">Close</button>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
