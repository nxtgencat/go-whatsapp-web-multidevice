export default {
  name: "ChatMessages",
  data() {
    return {
      jid: "",
      messages: [],
      loading: false,
      searchQuery: "",
      startTime: "",
      endTime: "",
      isFromMe: "",
      onlyMedia: false,
      currentPage: 1,
      pageSize: 20,
      totalMessages: 0,
      showModal: false,
      showFilters: false,
      downloadedMedia: {},
      downloadingMedia: new Set(),
      mediaDownloadErrors: {},
      maxConcurrentDownloads: 3,
      currentDownloads: 0,
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.totalMessages / this.pageSize);
    },
    formattedJid() {
      return (
        this.jid.trim() + (this.jid.includes("@") ? "" : "@s.whatsapp.net")
      );
    },
  },
  methods: {
    isValidForm() {
      return this.jid.trim().length > 0;
    },
    openModal() {
      const selectedJid = localStorage.getItem("selectedChatJid");
      if (selectedJid) {
        this.jid = selectedJid;
        localStorage.removeItem("selectedChatJid");
        this.loadMessages();
      }
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    async loadMessages() {
      if (!this.isValidForm()) {
        showErrorInfo("Please enter a valid JID");
        return;
      }
      this.loading = true;
      try {
        const params = new URLSearchParams({
          offset: (this.currentPage - 1) * this.pageSize,
          limit: this.pageSize,
        });
        if (this.searchQuery.trim()) params.append("search", this.searchQuery);
        if (this.startTime) params.append("start_time", this.startTime);
        if (this.endTime) params.append("end_time", this.endTime);
        if (this.isFromMe !== "") params.append("is_from_me", this.isFromMe);
        if (this.onlyMedia) params.append("media_only", "true");
        const response = await window.http.get(
          `/chat/${this.formattedJid}/messages?${params}`,
        );
        this.messages = response.data.results?.data || [];
        this.totalMessages = response.data.results?.pagination?.total || 0;
        if (this.messages.length === 0) showErrorInfo("No messages found");
        else this.downloadAllMediaInMessages();
      } catch (error) {
        showErrorInfo(
          error.response?.data?.message || "Failed to load messages",
        );
      } finally {
        this.loading = false;
      }
    },
    searchMessages() {
      this.currentPage = 1;
      this.loadMessages();
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.loadMessages();
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadMessages();
      }
    },
    handleReset() {
      this.jid = "";
      this.messages = [];
      this.searchQuery = "";
      this.startTime = "";
      this.endTime = "";
      this.isFromMe = "";
      this.onlyMedia = false;
      this.currentPage = 1;
      this.totalMessages = 0;
      this.downloadedMedia = {};
      this.downloadingMedia.clear();
      this.mediaDownloadErrors = {};
      this.currentDownloads = 0;
    },
    formatTimestamp(ts) {
      if (!ts) return "N/A";
      try {
        return new Date(ts).toLocaleString();
      } catch {
        return "N/A";
      }
    },
    formatMessageType(m) {
      if (m.media_type) return m.media_type.toUpperCase();
      if (m.message_type) return m.message_type.toUpperCase();
      return "TEXT";
    },
    formatSender(m) {
      if (m.is_from_me) return "Me";
      return m.push_name || m.sender_jid || "Unknown";
    },
    getMessageContent(m) {
      if (m.content) return m.content;
      if (m.text) return m.text;
      if (m.caption) return m.caption;
      if (m.media_type) return `[${m.media_type.toUpperCase()}]`;
      return "[No content]";
    },
    getMediaDisplay(message) {
      if (!message.media_type || !message.url || !message.id) return null;
      const mid = message.id;
      const info = this.downloadedMedia[mid];
      if (this.isMediaDownloading(mid)) return { type: "loading" };
      if (this.hasMediaDownloadError(mid))
        return { type: "error", messageId: mid };
      if (this.isMediaDownloaded(mid) && info) {
        const fp = info.file_path;
        const mt = info.media_type;
        const fn = info.filename;
        const fs = info.file_size;
        return {
          type: mt.toLowerCase(),
          filePath: fp,
          filename: fn,
          fileSize: fs,
        };
      }
      return { type: "available", mediaType: message.media_type };
    },
    isMediaDownloaded(mid) {
      return this.downloadedMedia[mid]?.status === "completed";
    },
    isMediaDownloading(mid) {
      return this.downloadingMedia.has(mid);
    },
    hasMediaDownloadError(mid) {
      return !!this.mediaDownloadErrors[mid];
    },
    async downloadMediaForMessage(message) {
      if (!message.media_type || !message.url || !message.id) return;
      const mid = message.id;
      if (this.isMediaDownloaded(mid) || this.isMediaDownloading(mid)) return;
      if (this.currentDownloads >= this.maxConcurrentDownloads) return;
      try {
        this.downloadingMedia.add(mid);
        this.currentDownloads++;
        if (this.mediaDownloadErrors[mid]) delete this.mediaDownloadErrors[mid];
        const response = await window.http.get(
          `/message/${mid}/download?phone=${this.formattedJid}`,
        );
        if (response.data?.results) {
          this.downloadedMedia[mid] = {
            file_path: response.data.results.file_path,
            media_type: response.data.results.media_type,
            file_size: response.data.results.file_size,
            filename: response.data.results.filename,
            status: "completed",
          };
        }
      } catch (error) {
        console.error(`Download failed for ${mid}:`, error);
        this.mediaDownloadErrors[mid] =
          error.response?.data?.message || "Download failed";
      } finally {
        this.downloadingMedia.delete(mid);
        this.currentDownloads--;
      }
    },
    async retryMediaDownload(mid) {
      const m = this.messages.find((x) => x.id === mid);
      if (m) {
        delete this.mediaDownloadErrors[mid];
        await this.downloadMediaForMessage(m);
      }
    },
    async downloadAllMediaInMessages() {
      const queue = this.messages.filter(
        (m) =>
          m.media_type &&
          m.url &&
          m.id &&
          !this.isMediaDownloaded(m.id) &&
          !this.isMediaDownloading(m.id),
      );
      if (!queue.length) return;
      const process = async () => {
        while (
          queue.length > 0 &&
          this.currentDownloads < this.maxConcurrentDownloads
        ) {
          const m = queue.shift();
          if (m) {
            await this.downloadMediaForMessage(m);
            await new Promise((r) => setTimeout(r, 100));
          }
        }
        if (
          queue.length > 0 &&
          this.currentDownloads < this.maxConcurrentDownloads
        )
          setTimeout(process, 500);
      };
      process();
    },
    backToChatList() {
      this.closeModal();
      setTimeout(() => {
        if (window.ChatListComponent?.openModal)
          window.ChatListComponent.openModal();
      }, 200);
    },
    fileSizeText(fs) {
      if (!fs) return "";
      return `(${Math.round(fs / 1024)} KB)`;
    },
  },
  mounted() {
    window.ChatMessagesComponent = this;
    this.handleRetryMediaDownload = (e) => this.retryMediaDownload(e.detail);
    document.addEventListener(
      "retryMediaDownload",
      this.handleRetryMediaDownload,
    );
  },
  beforeUnmount() {
    if (window.ChatMessagesComponent === this)
      delete window.ChatMessagesComponent;
    if (this.handleRetryMediaDownload)
      document.removeEventListener(
        "retryMediaDownload",
        this.handleRetryMediaDownload,
      );
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-chat)">Chat</span>
      <div class="card-title">Chat Messages</div>
      <div class="card-desc">View messages with advanced filtering</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box large">
          <div class="modal-header">
            Chat Messages
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Chat JID</label>
              <input
                type="text"
                placeholder="Phone or full JID (e.g. 123... or group-id@g.us)"
                v-model="jid"
                class="form-input"
              />
            </div>

            <!-- Collapsible Filters -->
            <div class="mb-4">
              <button type="button" class="btn btn-sm btn-ghost" @click="showFilters = !showFilters">
                {{ showFilters ? '' : '' }} Advanced Filters
              </button>
              <div v-if="showFilters" class="mt-3 border-2 border-gray-200 p-4 space-y-3">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div class="form-group" style="margin-bottom: 0">
                    <label class="form-label">Search Content</label>
                    <input
                      type="text"
                      placeholder="Search text..."
                      v-model="searchQuery"
                      class="form-input"
                    />
                  </div>
                  <div class="form-group" style="margin-bottom: 0">
                    <label class="form-label">Sender</label>
                    <select class="form-select" v-model="isFromMe">
                      <option value="">All</option>
                      <option value="true">My messages</option>
                      <option value="false">Their messages</option>
                    </select>
                  </div>
                  <div class="form-group" style="margin-bottom: 0">
                    <label class="form-label">&nbsp;</label>
                    <label class="toggle-wrap">
                      <span
                        class="toggle-track"
                        :class="{active: onlyMedia}"
                        @click="onlyMedia = !onlyMedia"
                      ></span>
                      <span class="toggle-label">Media only</span>
                    </label>
                  </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="form-group" style="margin-bottom: 0">
                    <label class="form-label">Start Date/Time</label>
                    <input type="datetime-local" v-model="startTime" class="form-input" />
                  </div>
                  <div class="form-group" style="margin-bottom: 0">
                    <label class="form-label">End Date/Time</label>
                    <input type="datetime-local" v-model="endTime" class="form-input" />
                  </div>
                </div>
              </div>
            </div>

            <div class="flex gap-2 mb-4">
              <button
                class="btn btn-primary"
                :class="{'btn-loading': loading}"
                :disabled="!isValidForm() || loading"
                @click="loadMessages"
              >
                {{ loading ? 'Loading...' : 'Load Messages' }}
              </button>
              <button class="btn btn-ghost" @click="handleReset">Reset</button>
            </div>

            <div v-if="loading" class="loader-center"><div class="loader"></div></div>
            <div v-else-if="messages.length === 0 && totalMessages === 0" class="msg-box info">
              Enter a JID and click "Load Messages" to view chat history.
            </div>

            <div v-else-if="messages.length > 0">
              <div class="msg-box info mb-4">
                <div class="msg-title">Chat: {{ formattedJid }}</div>
                <p class="text-sm">Showing {{ messages.length }} of {{ totalMessages }} messages</p>
              </div>

              <div class="space-y-2" style="max-height: 400px; overflow-y: auto; scrollbar-width: thin">
                <div
                  v-for="message in messages"
                  :key="message.id"
                  class="p-3 border-2 border-gray-200"
                  :style="{ borderLeft: message.is_from_me ? '4px solid var(--primary)' : '4px solid #999', background: message.is_from_me ? '#f0f7ff' : 'transparent' }"
                >
                  <div class="flex justify-between items-start mb-1">
                    <span
                      class="text-xs font-bold px-2 py-0.5 border border-gray-900"
                      :class="message.is_from_me ? 'bg-blue-100' : 'bg-gray-100'"
                    >
                      {{ formatSender(message) }}
                    </span>
                    <span class="text-xs font-bold px-2 py-0.5 border border-gray-900 bg-gray-50">
                      {{ formatMessageType(message) }}
                    </span>
                  </div>
                  <div class="text-xs text-gray-500 mb-1">
                    {{ formatTimestamp(message.timestamp) }}
                    <span v-if="message.id" class="ml-2 text-gray-400">ID: {{ message.id }}</span>
                  </div>
                  <div class="text-sm">{{ getMessageContent(message) }}</div>

                  <!-- Media Display -->
                  <div v-if="message.media_type && message.url" class="mt-2">
                    <template v-if="getMediaDisplay(message)">
                      <div
                        v-if="getMediaDisplay(message).type === 'loading'"
                        class="text-xs text-gray-500"
                      >
                        <div
                          class="loader"
                          style="
                            width: 16px;
                            height: 16px;
                            border-width: 2px;
                            display: inline-block;
                            vertical-align: middle;
                          "
                        ></div>
                        Downloading...
                      </div>
                      <div v-else-if="getMediaDisplay(message).type === 'error'" class="msg-box error">
                        <span class="text-xs">Failed to download</span>
                        <button
                          class="btn btn-sm btn-ghost ml-2"
                          @click="retryMediaDownload(message.id)"
                        >
                          Retry
                        </button>
                      </div>
                      <div v-else-if="getMediaDisplay(message).type === 'image'">
                        <img
                          :src="getMediaDisplay(message).filePath"
                          :alt="getMediaDisplay(message).filename"
                          style="max-width: 300px; max-height: 300px; border: 2px solid #222"
                          @error="$event.target.style.display='none'"
                        />
                      </div>
                      <div v-else-if="getMediaDisplay(message).type === 'video'">
                        <video
                          controls
                          style="max-width: 300px; max-height: 300px; border: 2px solid #222"
                          preload="metadata"
                        >
                          <source :src="getMediaDisplay(message).filePath" />
                        </video>
                      </div>
                      <div v-else-if="getMediaDisplay(message).type === 'audio'">
                        <audio controls style="width: 100%; max-width: 300px">
                          <source :src="getMediaDisplay(message).filePath" />
                        </audio>
                      </div>
                      <div v-else-if="getMediaDisplay(message).type === 'sticker'">
                        <img
                          :src="getMediaDisplay(message).filePath"
                          alt="Sticker"
                          style="max-width: 150px; max-height: 150px; border: 2px solid #222"
                          @error="$event.target.style.display='none'"
                        />
                      </div>
                      <div v-else-if="getMediaDisplay(message).type === 'document'">
                        <a
                          :href="getMediaDisplay(message).filePath"
                          :download="getMediaDisplay(message).filename"
                          class="btn btn-sm btn-ghost"
                        >
                          {{ getMediaDisplay(message).filename }} {{ fileSizeText(getMediaDisplay(message).fileSize) }}
                        </a>
                      </div>
                      <div v-else-if="getMediaDisplay(message).type === 'available'">
                        <span class="text-xs font-bold px-2 py-1 border-2 border-gray-900 bg-blue-100">
                          {{ message.media_type.toUpperCase() }} Available
                        </span>
                      </div>
                      <div v-else>
                        <span class="text-xs">Unknown media: {{ getMediaDisplay(message).type }}</span>
                      </div>
                    </template>
                  </div>
                </div>
              </div>

              <!-- Pagination -->
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
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="backToChatList">Back to Chat List</button>
            <button class="btn btn-ghost" @click="closeModal">Close</button>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
