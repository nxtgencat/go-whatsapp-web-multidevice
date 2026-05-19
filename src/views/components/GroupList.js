import GroupListParticipants from "./GroupListParticipants.js";

export default {
  name: "ListGroup",
  components: { GroupListParticipants },
  props: { connected: { default: null } },
  data() {
    return {
      groups: [],
      showModal: false,
      loading: false,
      // Requested Members state
      showRequestedMembersModal: false,
      requestedMembers: [],
      loadingRequestedMembers: false,
      processingMember: null,
      selectedGroupJID: null,
    };
  },
  methods: {
    async openModal() {
      this.showModal = true;
      try {
        this.loading = true;
        await this.submitApi();
        showSuccessInfo("Groups fetched");
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
        let response = await window.http.get(`/group`);
        this.groups = response.data.results.data;
      } catch (error) {
        if (error.response) throw new Error(error.response.data.message);
        throw new Error(error.message);
      }
    },
    async handleLeaveGroup(group_id) {
      if (!confirm("Are you sure to leave this group?")) return;
      try {
        await window.http.post(`/group/leave`, { group_id });
        await this.submitApi();
        showSuccessInfo("Success leave group");
      } catch (err) {
        showErrorInfo(err);
      }
    },
    async showParticipants(group) {
      try {
        await this.$refs.participantsModal.open(group);
      } catch (err) {
        showErrorInfo(err);
      }
    },
    handleExportParticipants(group) {
      if (!group || !group.JID) return;
      const baseURL =
        window.http && window.http.defaults && window.http.defaults.baseURL
          ? window.http.defaults.baseURL
          : "";
      const exportUrl = `${baseURL}/group/participants/export?group_id=${encodeURIComponent(group.JID)}`;
      window.open(exportUrl, "_blank");
    },
    isAdmin(group) {
      if (!group || !group.Participants) return false;
      return group.Participants.some(
        (p) => (p.is_admin || p.is_super_admin) && p.jid === group.OwnerJID,
      );
    },
    async handleSeeRequestedMember(group_id) {
      this.selectedGroupJID = group_id;
      this.loadingRequestedMembers = true;
      this.requestedMembers = [];
      this.showRequestedMembersModal = true;

      try {
        const response = await window.http.get(
          `/group/participant-requests?group_id=${encodeURIComponent(group_id)}`,
        );
        this.requestedMembers = response.data.results || [];
      } catch (error) {
        let errorMessage = "Failed to fetch requested members";
        if (error.response) {
          errorMessage = error.response.data.message || errorMessage;
        }
        showErrorInfo(errorMessage);
      } finally {
        this.loadingRequestedMembers = false;
      }
    },
    closeRequestedMembersModal() {
      this.showRequestedMembersModal = false;
    },
    async handleProcessRequest(member, action) {
      if (!this.selectedGroupJID || !member) return;

      const actionText = action === "approve" ? "approve" : "reject";
      const ok = confirm(
        `Are you sure you want to ${actionText} this member request?`,
      );
      if (!ok) return;

      try {
        this.processingMember = member.jid;

        const payload = {
          group_id: this.selectedGroupJID,
          participants: [this.formatJID(member.jid)],
        };

        await window.http.post(
          `/group/participant-requests/${action}`,
          payload,
        );

        // Remove the processed member from the list
        this.requestedMembers = this.requestedMembers.filter(
          (m) => m.jid !== member.jid,
        );

        showSuccessInfo(`Member request ${actionText}d`);
      } catch (error) {
        let errorMessage = `Failed to ${actionText} member request`;
        if (error.response) {
          errorMessage = error.response.data.message || errorMessage;
        }
        showErrorInfo(errorMessage);
      } finally {
        this.processingMember = null;
      }
    },
    formatJID(jid) {
      if (!jid) return "";
      return jid.split("@")[0];
    },
    formatDate(value) {
      if (!value) return "";
      if (isNaN(value)) return "Invalid date";
      return new Date(value * 1000).toLocaleString();
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-group)">Group</span>
      <div class="card-title">List Groups</div>
      <div class="card-desc">Display all your connected groups</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box large">
          <div class="modal-header">
            My Group List
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <div v-if="loading" class="loader-center"><div class="loader"></div></div>
            <div v-else-if="!groups.length" class="msg-box info">No groups found.</div>
            <div v-else class="overflow-x-auto">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Group ID</th>
                    <th>Name</th>
                    <th>Participants</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="g in groups" :key="g.JID">
                    <td class="text-xs font-mono">{{ formatJID(g.JID) }}</td>
                    <td>{{ g.Name || 'N/A' }}</td>
                    <td class="text-sm">{{ g.Participants ? g.Participants.length : 0 }}</td>
                    <td class="text-xs">{{ formatDate(g.GroupCreated) }}</td>
                    <td>
                      <div class="flex gap-2 flex-wrap">
                        <button class="btn btn-sm btn-ghost" @click="showParticipants(g)">
                          Members
                        </button>
                        <button class="btn btn-sm btn-ghost" @click="handleExportParticipants(g)">
                          Export CSV
                        </button>
                        <button
                          v-if="isAdmin(g)"
                          class="btn btn-sm btn-primary"
                          @click="handleSeeRequestedMember(g.JID)"
                        >
                          Requested Members
                        </button>
                        <button class="btn btn-sm btn-danger" @click="handleLeaveGroup(g.JID)">
                          Leave
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <GroupListParticipants ref="participantsModal" />

      <!-- Requested Members Modal -->
      <div v-if="showRequestedMembersModal" class="modal-overlay" @click.self="closeRequestedMembersModal">
        <div class="modal-box large">
          <div class="modal-header">
            Requested Group Members
            <button class="modal-close" @click="closeRequestedMembersModal">Close</button>
          </div>
          <div class="modal-body">
            <div v-if="loadingRequestedMembers" class="loader-center"><div class="loader"></div></div>

            <div v-else-if="requestedMembers.length === 0" class="msg-box info">
              <div class="msg-title">No Requested Members</div>
              <p class="text-sm">There are no pending member requests for this group.</p>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Phone Number</th>
                    <th>Request Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="member in requestedMembers" :key="member.jid">
                    <td>
                      <div class="font-bold text-sm">{{ formatJID(member.jid) }}</div>
                      <div v-if="member.display_name" class="text-xs text-gray-500">
                        {{ member.display_name }}
                      </div>
                    </td>
                    <td class="text-xs">{{ member.phone_number || formatJID(member.jid) }}</td>
                    <td class="text-xs">{{ formatDate(member.requested_at) }}</td>
                    <td>
                      <div class="flex gap-2">
                        <button
                          class="btn btn-sm btn-primary"
                          @click="handleProcessRequest(member, 'approve')"
                          :disabled="processingMember === member.jid"
                          :class="{'btn-loading': processingMember === member.jid}"
                        >
                          Approve
                        </button>
                        <button
                          class="btn btn-sm btn-danger"
                          @click="handleProcessRequest(member, 'reject')"
                          :disabled="processingMember === member.jid"
                          :class="{'btn-loading': processingMember === member.jid}"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="closeRequestedMembersModal">Close</button>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
