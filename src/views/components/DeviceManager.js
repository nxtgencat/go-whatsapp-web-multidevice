export default {
  name: "DeviceManager",
  props: {
    wsBasePath: {
      type: String,
      default: "",
    },
  },
  emits: ["device-selected", "devices-updated"],
  data() {
    return {
      deviceList: [],
      selectedDeviceId: "",
      deviceIdInput: "",
      isCreatingDevice: false,
      deviceToDelete: { id: "", jid: "", state: "" },
      isDeleting: false,
      showDeleteModal: false,
    };
  },
  computed: {
    selectedDevice() {
      if (!this.selectedDeviceId) return null;
      return (
        this.deviceList.find(
          (d) => (d.id || d.device) === this.selectedDeviceId,
        ) || null
      );
    },
    isSelectedDeviceLoggedIn() {
      return this.selectedDevice?.state === "logged_in";
    },
  },
  methods: {
    async fetchDevices() {
      try {
        const res = await window.http.get(`/devices`);
        this.deviceList = res.data.results || [];
        if (!this.selectedDeviceId && this.deviceList.length > 0) {
          const first = this.deviceList[0].id || this.deviceList[0].device;
          this.setDeviceContext(first);
        }
        this.$emit("devices-updated", this.deviceList);
      } catch (err) {
        console.error(err);
      }
    },
    setDeviceContext(id) {
      if (!id) {
        showErrorInfo("Device ID is required");
        return;
      }
      this.selectedDeviceId = id;
      this.$emit("device-selected", id);
      showSuccessInfo(`Using device ${id}`);
    },
    async createDevice() {
      try {
        this.isCreatingDevice = true;
        const payload = this.deviceIdInput
          ? { device_id: this.deviceIdInput }
          : {};
        const res = await window.http.post("/devices", payload);
        const deviceID =
          res.data?.results?.id ||
          res.data?.results?.device_id ||
          this.deviceIdInput;
        this.deviceIdInput = "";
        this.setDeviceContext(deviceID);
        await this.fetchDevices();
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          err.message ||
          "Failed to create device";
        showErrorInfo(msg);
      } finally {
        this.isCreatingDevice = false;
      }
    },
    openDeleteModal(deviceId, jid) {
      const device = this.deviceList.find(
        (d) => (d.id || d.device) === deviceId,
      );
      this.deviceToDelete = {
        id: deviceId,
        jid: jid || "",
        state: device?.state || "",
      };
      this.showDeleteModal = true;
    },
    resetDeleteState() {
      this.deviceToDelete = { id: "", jid: "", state: "" };
      this.isDeleting = false;
      this.showDeleteModal = false;
    },
    async executeDelete() {
      const deviceId = this.deviceToDelete.id;
      if (!deviceId) {
        showErrorInfo("No device selected for deletion");
        return;
      }
      try {
        this.isDeleting = true;

        // Logout first (fire and forget), then delete
        window.http
          .get(`/app/logout`, {
            headers: { "X-Device-Id": encodeURIComponent(deviceId) },
          })
          .catch(() => {});

        await window.http.delete(`/devices/${encodeURIComponent(deviceId)}`);
        this.showDeleteModal = false;

        if (this.selectedDeviceId === deviceId) {
          this.selectedDeviceId = "";
          this.$emit("device-selected", "");
        }

        await this.fetchDevices();
        this.resetDeleteState();
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          err.message ||
          "Failed to delete device";
        showErrorInfo(msg);
        this.isDeleting = false;
      }
    },
    refresh() {
      this.fetchDevices();
    },
    updateDeviceList(devices) {
      if (Array.isArray(devices)) {
        this.deviceList = devices;
        this.$emit("devices-updated", devices);
      }
    },
  },
  mounted() {
    this.fetchDevices();
  },
  template: `
    <div class="device-panel">
      <div class="device-panel-header">Device Setup</div>
      <div class="device-panel-body">
        <div class="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
          <!-- Left: Device form & list -->
          <div>
            <p class="text-sm text-gray-600 mb-4">Create or select a device_id, then open login.</p>

            <div class="flex gap-3 mb-4 items-end">
              <div class="form-group flex-1" style="margin-bottom: 0">
                <label class="form-label">Device ID (optional)</label>
                <input
                  type="text"
                  v-model="deviceIdInput"
                  class="form-input"
                  placeholder="Leave empty to auto-generate"
                  @keyup.enter="createDevice"
                />
              </div>
              <button
                class="btn btn-primary"
                :class="{'btn-loading': isCreatingDevice}"
                @click="createDevice"
                :disabled="isCreatingDevice"
              >
                Create Device
              </button>
            </div>

            <hr class="border-t-2 border-gray-900 my-4" />

            <!-- Device List -->
            <div class="msg-box info">
              <div class="msg-title">Your Devices</div>
              <div v-if="deviceList.length" class="device-list-scroll mt-2">
                <div v-for="dev in deviceList" :key="dev.id || dev.device" class="device-list-item">
                  <div class="min-w-0">
                    <div class="font-bold text-sm truncate">{{ dev.id || dev.device }}</div>
                    <div class="text-xs text-gray-500">
                      State: {{ dev.state || 'unknown' }}
                      <span v-if="dev.jid">- JID: {{ dev.jid }}</span>
                    </div>
                  </div>
                  <div class="flex gap-2 flex-shrink-0">
                    <button
                      class="btn btn-sm"
                      :class="selectedDeviceId === (dev.id || dev.device) ? 'btn-dark' : 'btn-ghost'"
                      @click="setDeviceContext(dev.id || dev.device)"
                    >
                      {{ selectedDeviceId === (dev.id || dev.device) ? 'Active' : 'Use' }}
                    </button>
                    <button
                      class="btn btn-sm btn-danger"
                      @click="openDeleteModal(dev.id || dev.device, dev.jid)"
                      :class="{'btn-loading': isDeleting && deviceToDelete.id === (dev.id || dev.device)}"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
              <p v-else class="text-sm mt-2">No devices yet. Create one to begin.</p>
            </div>
          </div>

          <!-- Right: How-to -->
          <div class="msg-box warning">
            <div class="msg-title">How to log in</div>
            <ol class="list-decimal list-inside text-sm space-y-2 mt-2">
              <li>
                Create a device to get
                <code class="code-tag">device_id</code>
              </li>
              <li>
                Send
                <code class="code-tag">X-Device-Id</code>
                on REST calls
              </li>
              <li>Open Login card to pair (QR or code)</li>
              <li>
                WebSocket:
                <code class="code-tag">{{ wsBasePath }}/ws?device_id=&lt;id&gt;</code>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="resetDeleteState">
        <div class="modal-box">
          <div class="modal-header">
            Confirm Delete Device
            <button class="modal-close" @click="resetDeleteState">Close</button>
          </div>
          <div class="modal-body">
            <p class="mb-3">Are you sure you want to delete this device?</p>
            <div class="bg-gray-50 border-2 border-gray-900 p-3 mb-3">
              <p class="text-sm">
                <strong>Device ID:</strong>
                <code class="code-tag">{{ deviceToDelete.id }}</code>
              </p>
              <p v-if="deviceToDelete.jid" class="text-sm">
                <strong>JID:</strong>
                <code class="code-tag">{{ deviceToDelete.jid }}</code>
              </p>
            </div>
            <div class="msg-box error">
              <div class="msg-title">Warning</div>
              <p class="text-sm">
                This will permanently delete the device and all associated data. This cannot be undone.
              </p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="resetDeleteState">Cancel</button>
            <button
              class="btn btn-danger"
              :class="{'btn-loading': isDeleting}"
              @click="executeDelete"
              :disabled="isDeleting"
            >
              Delete Device
            </button>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
