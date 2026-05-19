import FormRecipient from "./generic/FormRecipient.js";

export default {
  name: "SendPoll",
  components: { FormRecipient },
  data() {
    return {
      phone: "",
      type: window.TYPEUSER,
      loading: false,
      question: "",
      options: ["", ""],
      max_answer: 1,
      duration: 0,
      showModal: false,
    };
  },
  computed: {
    phone_id() {
      return this.phone + this.type;
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
      if (this.type !== window.TYPESTATUS && !this.phone.trim()) return false;
      if (!this.question.trim()) return false;
      if (this.options.some((o) => o.trim() === "")) return false;
      if (this.max_answer < 1 || this.max_answer > this.options.length)
        return false;
      return true;
    },
    async handleSubmit() {
      if (!this.isValidForm() || this.loading) return;
      try {
        let r = await this.submitApi();
        window.showSuccessInfo(r);
        this.closeModal();
      } catch (err) {
        window.showErrorInfo(err);
      }
    },
    async submitApi() {
      this.loading = true;
      try {
        const payload = {
          phone: this.phone_id,
          question: this.question,
          options: this.options,
          max_answer: this.max_answer,
          ...(this.duration && this.duration > 0
            ? { duration: this.duration }
            : {}),
        };
        const response = await window.http.post(`/send/poll`, payload);
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
      this.phone = "";
      this.type = window.TYPEUSER;
      this.question = "";
      this.options = ["", ""];
      this.max_answer = 1;
      this.duration = 0;
    },
    addOption() {
      this.options.push("");
    },
    deleteOption(i) {
      this.options.splice(i, 1);
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-send)">Send</span>
      <div class="card-title">Send Poll</div>
      <div class="card-desc">Send a poll/vote with multiple options</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Send Poll
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleSubmit">
              <FormRecipient v-model:type="type" v-model:phone="phone" />
              <div class="form-group">
                <label class="form-label">Question</label>
                <input
                  v-model="question"
                  type="text"
                  class="form-input"
                  placeholder="Enter question"
                  aria-label="poll question"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Options</label>
                <div class="space-y-2">
                  <div v-for="(opt, i) in options" :key="i" class="flex gap-2">
                    <input
                      type="text"
                      class="form-input"
                      placeholder="Option..."
                      v-model="options[i]"
                      aria-label="poll option"
                    />
                    <button type="button" class="btn btn-sm btn-danger" @click="deleteOption(i)">
                      -
                    </button>
                  </div>
                  <button type="button" class="btn btn-sm btn-ghost" @click="addOption">
                    + Add Option
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Max Answers Allowed</label>
                <input
                  v-model.number="max_answer"
                  type="number"
                  class="form-input"
                  placeholder="Max answers per user"
                  aria-label="poll max answers"
                  min="1"
                  max="50"
                />
                <small class="text-xs text-gray-500 mt-1 block">
                  How many options each user can select
                </small>
              </div>
              <div class="form-group">
                <label class="form-label">Disappearing Duration (seconds)</label>
                <input
                  v-model.number="duration"
                  type="number"
                  min="0"
                  class="form-input"
                  placeholder="0 (no expiry)"
                  aria-label="duration"
                />
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
              Send
            </button>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
