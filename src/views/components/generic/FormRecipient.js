export default {
  name: "FormRecipient",
  emits: ["update:type", "update:phone"],
  props: {
    type: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    showStatus: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      recipientTypes: [],
    };
  },
  computed: {
    phone_id() {
      return this.phone + this.type;
    },
    showPhoneInput() {
      return this.type !== window.TYPESTATUS;
    },
    filteredRecipientTypes() {
      return this.recipientTypes.filter((type) => {
        if (!this.showStatus && type.value === window.TYPESTATUS) {
          return false;
        }
        return true;
      });
    },
  },
  mounted() {
    this.recipientTypes = [
      { value: window.TYPEUSER, text: "Private Message" },
      { value: window.TYPEGROUP, text: "Group Message" },
      { value: window.TYPENEWSLETTER, text: "Newsletter" },
      { value: window.TYPELID, text: "LID (Linked ID)" },
      { value: window.TYPESTATUS, text: "Status" },
    ];
  },
  methods: {
    updateType(event) {
      this.$emit("update:type", event.target.value);
      if (event.target.value === window.TYPESTATUS) {
        this.$emit("update:phone", "");
      }
    },
    updatePhone(event) {
      this.$emit("update:phone", event.target.value);
    },
  },
  template: `
    <div class="form-group">
      <label class="form-label">Type</label>
      <select @change="updateType" class="form-select">
        <option v-for="t in filteredRecipientTypes" :value="t.value" :selected="t.value === type">
          {{ t.text }}
        </option>
      </select>
    </div>

    <div v-if="showPhoneInput" class="form-group">
      <label class="form-label">Phone / Group ID</label>
      <input
        :value="phone"
        @input="updatePhone"
        class="form-input"
        placeholder="Enter phone or group ID"
        aria-label="wa identifier"
      />
      <input
        :value="phone_id"
        disabled
        class="form-input mt-2 text-sm opacity-60"
        aria-label="whatsapp_id"
      />
    </div>
  `,
};
