export default {
  name: "GroupInfo",
  data() {
    return { group_id: "", groupInfo: null, loading: false, showModal: false };
  },
  computed: {
    fullGroupID() {
      if (!this.group_id) return "";
      return this.group_id.endsWith(window.TYPEGROUP)
        ? this.group_id
        : this.group_id + window.TYPEGROUP;
    },
    formattedGroupCreated() {
      if (!this.groupInfo?.GroupCreated) return "";
      return new Date(this.groupInfo.GroupCreated).toLocaleString();
    },
    formattedNameSetAt() {
      if (!this.groupInfo?.NameSetAt) return "";
      return new Date(this.groupInfo.NameSetAt).toLocaleString();
    },
    formattedTopicSetAt() {
      if (!this.groupInfo?.TopicSetAt) return "";
      return new Date(this.groupInfo.TopicSetAt).toLocaleString();
    },
    disappearingTimerText() {
      if (!this.groupInfo?.DisappearingTimer) return "";
      const d = Math.floor(this.groupInfo.DisappearingTimer / 86400);
      const h = Math.floor((this.groupInfo.DisappearingTimer % 86400) / 3600);
      const m = Math.floor((this.groupInfo.DisappearingTimer % 3600) / 60);
      if (d > 0) return `${d} day${d > 1 ? "s" : ""}`;
      if (h > 0) return `${h} hour${h > 1 ? "s" : ""}`;
      if (m > 0) return `${m} minute${m > 1 ? "s" : ""}`;
      return `${this.groupInfo.DisappearingTimer}s`;
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
    isValidForm() {
      return this.group_id.trim() !== "";
    },
    async handleSubmit() {
      if (!this.isValidForm() || this.loading) return;
      try {
        await this.fetchInfo();
        showSuccessInfo("Group info fetched");
      } catch (err) {
        showErrorInfo(err.message || err);
      }
    },
    async fetchInfo() {
      this.loading = true;
      try {
        const response = await window.http.get(
          `/group/info?group_id=${encodeURIComponent(this.fullGroupID)}`,
        );
        this.groupInfo = response.data.results;
      } catch (error) {
        if (error.response) throw new Error(error.response.data.message);
        throw new Error(error.message);
      } finally {
        this.loading = false;
      }
    },
    reset() {
      this.group_id = "";
      this.groupInfo = null;
      this.loading = false;
    },
    formatPhoneNumber(phone) {
      if (!phone) return "";
      return phone.replace("@s.whatsapp.net", "");
    },
    getParticipantRole(p) {
      if (p.IsSuperAdmin) return "Super Admin";
      if (p.IsAdmin) return "Admin";
      return "Member";
    },
    getRoleBg(p) {
      if (p.IsSuperAdmin) return "bg-red-100 text-red-800";
      if (p.IsAdmin) return "bg-orange-100 text-orange-800";
      return "bg-teal-100 text-teal-800";
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-group)">Group</span>
      <div class="card-title">Group Info</div>
      <div class="card-desc">Search detailed information about a group</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box large">
          <div class="modal-header">
            Group Information
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <div class="flex gap-2 mb-4">
              <input v-model="group_id" class="form-input" placeholder="e.g. 1203630..." />
              <button
                type="button"
                class="btn btn-primary"
                :class="{'btn-loading': loading}"
                :disabled="!isValidForm() || loading"
                @click.prevent="handleSubmit"
              >
                Search
              </button>
            </div>
            <small class="text-xs text-gray-500 block mb-4">Full ID: {{ fullGroupID }}</small>

            <div v-if="groupInfo">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <!-- Basic Info -->
                <div class="border-2 border-gray-900 p-4">
                  <h4 class="font-bold text-sm uppercase tracking-wider mb-3">Basic Information</h4>
                  <div class="space-y-2 text-sm">
                    <div>
                      <strong>Name:</strong>
                      {{ groupInfo.Name || 'No name' }}
                    </div>
                    <div>
                      <strong>Group ID:</strong>
                      <code class="code-tag">{{ groupInfo.JID }}</code>
                    </div>
                    <div>
                      <strong>Description:</strong>
                      {{ groupInfo.Topic || 'No description' }}
                    </div>
                    <div>
                      <strong>Created:</strong>
                      {{ formattedGroupCreated }}
                    </div>
                    <div>
                      <strong>Country:</strong>
                      {{ groupInfo.CreatorCountryCode }}
                    </div>
                  </div>
                </div>
                <!-- Settings -->
                <div class="border-2 border-gray-900 p-4">
                  <h4 class="font-bold text-sm uppercase tracking-wider mb-3">Settings</h4>
                  <div class="flex flex-wrap gap-2 mb-3">
                    <span
                      class="text-xs font-bold px-2 py-1 border-2 border-gray-900"
                      :class="groupInfo.IsLocked ? 'bg-red-100' : 'bg-green-100'"
                    >
                      {{ groupInfo.IsLocked ? 'Locked' : 'Unlocked' }}
                    </span>
                    <span
                      class="text-xs font-bold px-2 py-1 border-2 border-gray-900"
                      :class="groupInfo.IsAnnounce ? 'bg-orange-100' : 'bg-blue-100'"
                    >
                      {{ groupInfo.IsAnnounce ? 'Announce' : 'Open Chat' }}
                    </span>
                    <span
                      class="text-xs font-bold px-2 py-1 border-2 border-gray-900"
                      :class="groupInfo.IsEphemeral ? 'bg-purple-100' : 'bg-gray-100'"
                    >
                      {{ groupInfo.IsEphemeral ? ' Disappearing' : ' Persistent' }}
                    </span>
                    <span
                      v-if="groupInfo.IsEphemeral"
                      class="text-xs font-bold px-2 py-1 border-2 border-gray-900 bg-purple-100"
                    >
                      {{ disappearingTimerText }}
                    </span>
                  </div>
                  <div class="flex flex-wrap gap-2 mb-3">
                    <span
                      class="text-xs font-bold px-2 py-1 border-2 border-gray-900"
                      :class="groupInfo.IsJoinApprovalRequired ? 'bg-red-100' : 'bg-green-100'"
                    >
                      {{ groupInfo.IsJoinApprovalRequired ? ' Approval Required' : ' Open Join' }}
                    </span>
                    <span class="text-xs font-bold px-2 py-1 border-2 border-gray-900 bg-gray-100">
                      {{ groupInfo.MemberAddMode }}
                    </span>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-if="groupInfo.IsIncognito"
                      class="text-xs font-bold px-2 py-1 border-2 border-gray-900 bg-gray-200"
                    >
                      Incognito
                    </span>
                    <span
                      v-if="groupInfo.IsParent"
                      class="text-xs font-bold px-2 py-1 border-2 border-gray-900 bg-teal-100"
                    >
                      Parent Group
                    </span>
                    <span
                      v-if="groupInfo.IsDefaultSubGroup"
                      class="text-xs font-bold px-2 py-1 border-2 border-gray-900 bg-yellow-100"
                    >
                      Default Sub Group
                    </span>
                  </div>
                </div>
              </div>
              <!-- Participants -->
              <div class="border-2 border-gray-900 p-4 mb-4">
                <h4 class="font-bold text-sm uppercase tracking-wider mb-3">
                  Participants ({{ groupInfo.Participants ? groupInfo.Participants.length : 0 }})
                </h4>
                <div class="overflow-x-auto">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Phone</th>
                        <th>JID</th>
                        <th>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="p in groupInfo.Participants" :key="p.JID">
                        <td class="text-sm font-bold">
                          {{ formatPhoneNumber(p.PhoneNumber) }}
                          <span v-if="p.DisplayName" class="text-xs text-gray-500 ml-1">
                            {{ p.DisplayName }}
                          </span>
                        </td>
                        <td class="text-xs font-mono">
                          {{ p.JID }}
                          <span v-if="p.LID" class="text-xs text-gray-400 ml-1">LID: {{ p.LID }}</span>
                        </td>
                        <td>
                          <span
                            class="text-xs font-bold px-2 py-1 border-2 border-gray-900"
                            :class="getRoleBg(p)"
                          >
                            {{ getParticipantRole(p) }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <!-- Metadata -->
              <div class="border-2 border-gray-900 p-4">
                <h4 class="font-bold text-sm uppercase tracking-wider mb-3">Metadata</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div class="space-y-2">
                    <div>
                      <strong>Name Last Changed:</strong>
                      {{ formattedNameSetAt }}
                      <br />
                      <span class="text-xs text-gray-500">
                        By: {{ formatPhoneNumber(groupInfo.NameSetBy) }}
                      </span>
                    </div>
                    <div>
                      <strong>Topic Last Changed:</strong>
                      {{ formattedTopicSetAt }}
                      <br />
                      <span class="text-xs text-gray-500">
                        By: {{ formatPhoneNumber(groupInfo.TopicSetBy) }}
                      </span>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <div>
                      <strong>Owner:</strong>
                      {{ formatPhoneNumber(groupInfo.OwnerJID) }}
                    </div>
                    <div>
                      <strong>Participant Version:</strong>
                      {{ groupInfo.ParticipantVersionID }}
                    </div>
                    <div>
                      <strong>Announce Version:</strong>
                      {{ groupInfo.AnnounceVersionID }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
