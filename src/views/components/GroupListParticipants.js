export default {
  name: "GroupListParticipants",
  emits: ["closed"],
  data() {
    return {
      selectedGroup: null,
      loading: false,
      participants: [],
      showModal: false,
    };
  },
  methods: {
    async open(group) {
      if (!group || !group.JID) throw new Error("Invalid group data");
      this.selectedGroup = {
        id: group.JID,
        name: group.Name || this.formatJID(group.JID),
      };
      this.loading = true;
      this.participants = [];
      this.showModal = true;
      try {
        const response = await window.http.get(
          `/group/participants?group_id=${encodeURIComponent(group.JID)}`,
        );
        const results = response.data.results || {};
        this.participants = results.participants || [];
        if (results.name) this.selectedGroup.name = results.name;
      } catch (error) {
        this.selectedGroup = null;
        if (error.response?.data?.message)
          throw new Error(error.response.data.message);
        throw new Error(error.message || "Failed to fetch participants");
      } finally {
        this.loading = false;
      }
    },
    close() {
      this.showModal = false;
      this.selectedGroup = null;
      this.participants = [];
      this.$emit("closed");
    },
    formatJID(jid) {
      if (!jid) return "";
      return jid.split("@")[0];
    },
    formatParticipantPhone(p) {
      if (!p) return "";
      return p.phone_number
        ? this.formatJID(p.phone_number)
        : this.formatJID(p.jid);
    },
    getParticipantRole(p) {
      if (!p) return "Member";
      if (p.is_super_admin) return "Super Admin";
      if (p.is_admin) return "Admin";
      return "Member";
    },
    getRoleBg(p) {
      if (!p) return "bg-gray-200";
      if (p.is_super_admin) return "bg-red-100 text-red-800";
      if (p.is_admin) return "bg-orange-100 text-orange-800";
      return "bg-teal-100 text-teal-800";
    },
  },
  template: `
    <div v-if="showModal" class="modal-overlay" @click.self="close">
      <div class="modal-box large">
        <div class="modal-header">
          Group Participants
          <span v-if="selectedGroup" class="text-sm font-normal ml-2 opacity-80">
            {{ selectedGroup.name }}
          </span>
          <button class="modal-close" @click="close">Close</button>
        </div>
        <div class="modal-body">
          <div v-if="loading" class="loader-center"><div class="loader"></div></div>
          <div v-else-if="!participants.length" class="msg-box info">No participants found.</div>
          <div v-else class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Phone</th>
                  <th>LID</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in participants" :key="p.jid">
                  <td>
                    <div class="font-bold text-sm">{{ formatJID(p.jid) }}</div>
                    <div v-if="p.display_name" class="text-xs text-gray-500">{{ p.display_name }}</div>
                  </td>
                  <td class="text-xs">{{ formatParticipantPhone(p) }}</td>
                  <td class="text-xs">
                    <span v-if="p.lid">{{ formatJID(p.lid) }}</span>
                    <span v-else>-</span>
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
        <div class="modal-footer"><button class="btn btn-ghost" @click="close">Close</button></div>
      </div>
    </div>
  `,
};
