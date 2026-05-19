export default {
  name: "ChatList",
  data() {
    return {
      chats: [],
      loading: false,
      searchQuery: "",
      includeMediaChats: false,
      archiveFilter: "",
      currentPage: 1,
      pageSize: 10,
      totalChats: 0,
      selectedChatJid: "",
      showModal: false,
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.totalChats / this.pageSize);
    },
    filteredChats() {
      if (!this.searchQuery) return this.chats;
      return this.chats.filter(
        (c) =>
          c.name?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          c.jid?.toLowerCase().includes(this.searchQuery.toLowerCase()),
      );
    },
  },
  methods: {
    openModal() {
      this.showModal = true;
      this.loadChats();
    },
    closeModal() {
      this.showModal = false;
    },
    async loadChats() {
      this.loading = true;
      try {
        const params = new URLSearchParams({
          offset: (this.currentPage - 1) * this.pageSize,
          limit: this.pageSize,
        });
        if (this.searchQuery.trim()) params.append("search", this.searchQuery);
        if (this.includeMediaChats) params.append("has_media", "true");
        if (this.archiveFilter !== "")
          params.append("archived", this.archiveFilter);
        const response = await window.http.get(`/chats?${params}`);
        this.chats = response.data.results?.data || [];
        this.totalChats = response.data.results?.pagination?.total || 0;
      } catch (error) {
        showErrorInfo(error.response?.data?.message || "Failed to load chats");
      } finally {
        this.loading = false;
      }
    },
    async searchChats() {
      this.currentPage = 1;
      await this.loadChats();
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.loadChats();
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadChats();
      }
    },
    selectChat(jid) {
      this.selectedChatJid = jid;
      localStorage.setItem("selectedChatJid", jid);
      this.closeModal();
      setTimeout(() => {
        if (window.ChatMessagesComponent?.openModal)
          window.ChatMessagesComponent.openModal();
      }, 200);
    },
    formatTimestamp(ts) {
      if (!ts) return "N/A";
      try {
        return new Date(ts).toLocaleString();
      } catch {
        return "N/A";
      }
    },
    formatJid(jid) {
      if (!jid) return "";
      if (jid.includes("@g.us")) return "Group";
      if (jid.includes("@s.whatsapp.net")) return "Contact";
      return "Other";
    },
  },
  mounted() {
    window.ChatListComponent = this;
  },
  beforeUnmount() {
    if (window.ChatListComponent === this) delete window.ChatListComponent;
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-chat)">Chat</span>
      <div class="card-title">Chat List</div>
      <div class="card-desc">View all chats with search and pagination</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box large">
          <div class="modal-header">
            Chat List
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div class="form-group" style="margin-bottom: 0">
                <label class="form-label">Search</label>
                <input
                  type="text"
                  placeholder="Search by name or JID..."
                  v-model="searchQuery"
                  @input="searchChats"
                  class="form-input"
                />
              </div>
              <div class="form-group" style="margin-bottom: 0">
                <label class="form-label">&nbsp;</label>
                <label class="toggle-wrap">
                  <span
                    class="toggle-track"
                    :class="{active: includeMediaChats}"
                    @click="includeMediaChats = !includeMediaChats; searchChats()"
                  ></span>
                  <span class="toggle-label">Media only</span>
                </label>
              </div>
              <div class="form-group" style="margin-bottom: 0">
                <label class="form-label">Archive Filter</label>
                <select class="form-select" v-model="archiveFilter" @change="searchChats">
                  <option value="">All Chats</option>
                  <option value="true">Archived</option>
                  <option value="false">Non-Archived</option>
                </select>
              </div>
            </div>
            <hr class="border-t-2 border-gray-900 my-4" />
            <div v-if="loading" class="loader-center"><div class="loader"></div></div>
            <div v-else-if="filteredChats.length === 0" class="msg-box info">No chats found.</div>
            <div v-else>
              <div class="overflow-x-auto">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>JID</th>
                      <th>Last Message</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="chat in filteredChats" :key="chat.jid">
                      <td class="font-bold text-sm">{{ chat.name || 'Unknown' }}</td>
                      <td>
                        <span
                          class="text-xs font-bold px-2 py-1 border-2 border-gray-900"
                          :class="chat.jid?.includes('@g.us') ? 'bg-blue-100' : 'bg-green-100'"
                        >
                          {{ formatJid(chat.jid) }}
                        </span>
                      </td>
                      <td class="text-xs font-mono">{{ chat.jid }}</td>
                      <td class="text-xs">{{ formatTimestamp(chat.last_message_time) }}</td>
                      <td>
                        <button class="btn btn-sm btn-primary" @click="selectChat(chat.jid)">
                          View
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="totalPages > 1" class="flex items-center justify-center gap-4 mt-4">
                <button class="btn btn-sm btn-ghost" @click="prevPage" :disabled="currentPage === 1">
                  Prev
                </button>
                <span class="text-sm font-bold">Page {{ currentPage }} / {{ totalPages }}</span>
                <button
                  class="btn btn-sm btn-ghost"
                  @click="nextPage"
                  :disabled="currentPage === totalPages"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
