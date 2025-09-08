// components/setup-form.js
/**
 * Setup form component for interview configuration
 */

class SetupForm {
  constructor(onSubmit) {
    this.onSubmit = onSubmit;
    this.formData = {
      role: "",
      domain: "",
      mode: "Technical",
      difficulty: "Medium",
      numQuestions: 5,
    };
    this.init();
  }

  init() {
    this.render();
    this.setupEventListeners();
    this.loadSavedPreferences();
  }

  render() {
    const setupScreen = document.getElementById("setupScreen");
    if (!setupScreen) return;

    setupScreen.innerHTML = `
            <div class="card setup-card">
                <div class="card-header">
                    <h3 class="card-title">Configure Your Interview</h3>
                    <div class="text-sm text-secondary">Customize your interview experience</div>
                </div>
                
                <form id="setupForm" class="setup-form">
                    <div class="form-group">
                        <label class="form-label" for="role">Role *</label>
                        <select class="form-select" id="role" name="role" required>
                            <option value="">Select a role...</option>
                            <option value="Software Engineer">Software Engineer</option>
                            <option value="Frontend Developer">Frontend Developer</option>
                            <option value="Backend Developer">Backend Developer</option>
                            <option value="Full Stack Developer">Full Stack Developer</option>
                            <option value="Data Scientist">Data Scientist</option>
                            <option value="Data Engineer">Data Engineer</option>
                            <option value="ML Engineer">ML Engineer</option>
                            <option value="DevOps Engineer">DevOps Engineer</option>
                            <option value="Product Manager">Product Manager</option>
                            <option value="Engineering Manager">Engineering Manager</option>
                            <option value="Security Engineer">Security Engineer</option>
                            <option value="Mobile Developer">Mobile Developer</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="domain">Domain (Optional)</label>
                        <select class="form-select" id="domain" name="domain">
                            <option value="">Select domain...</option>
                            <option value="System Design">System Design</option>
                            <option value="Algorithms & Data Structures">Algorithms & Data Structures</option>
                            <option value="Database Design">Database Design</option>
                            <option value="API Design">API Design</option>
                            <option value="Machine Learning">Machine Learning</option>
                            <option value="Cloud Architecture">Cloud Architecture</option>
                            <option value="Security">Security</option>
                            <option value="Performance Optimization">Performance Optimization</option>
                            <option value="Microservices">Microservices</option>
                            <option value="Frontend Architecture">Frontend Architecture</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="mode">Interview Mode</label>
                        <select class="form-select" id="mode" name="mode">
                            <option value="Technical">Technical Interview</option>
                            <option value="Behavioral">Behavioral Interview</option>
                        </select>
                        <div class="help-text">
                            <small class="text-secondary">
                                Technical: Focus on problem-solving and technical skills<br>
                                Behavioral: Focus on past experiences and soft skills
                            </small>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="difficulty">Difficulty Level</label>
                        <select class="form-select" id="difficulty" name="difficulty">
                            <option value="Easy">Easy - Entry Level</option>
                            <option value="Medium">Medium - Mid Level</option>
                            <option value="Hard">Hard - Senior Level</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="numQuestions">Number of Questions</label>
                        <select class="form-select" id="numQuestions" name="numQuestions">
                            <option value="3">3 Questions (~15 minutes)</option>
                            <option value="4">4 Questions (~20 minutes)</option>
                            <option value="5">5 Questions (~25 minutes)</option>
                            <option value="6">6 Questions (~30 minutes)</option>
                            <option value="7">7 Questions (~35 minutes)</option>
                        </select>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="loadPresetBtn">
                            Load Preset
                        </button>
                        <button type="submit" class="btn btn-primary" id="startBtn">
                            Start Interview
                        </button>
                    </div>
                </form>

                <div class="setup-tips">
                    <h4>💡 Tips for Success</h4>
                    <ul>
                        <li>Choose a difficulty level that matches your experience</li>
                        <li>Ensure you're in a quiet environment</li>
                        <li>Have paper/whiteboard ready for technical questions</li>
                        <li>Think out loud to demonstrate your problem-solving process</li>
                    </ul>
                </div>
            </div>
        `;
  }

  setupEventListeners() {
    const form = document.getElementById("setupForm");
    const loadPresetBtn = document.getElementById("loadPresetBtn");
    const roleSelect = document.getElementById("role");
    const domainSelect = document.getElementById("domain");

    if (form) {
      form.addEventListener("submit", this.handleSubmit.bind(this));

      // Auto-save preferences on change
      form.addEventListener("change", this.savePreferences.bind(this));
    }

    if (loadPresetBtn) {
      loadPresetBtn.addEventListener(
        "click",
        this.showPresetOptions.bind(this)
      );
    }

    // Role → Domain dependent options
    if (roleSelect && domainSelect) {
      const roleToDomains = {
        "Software Engineer": [
          "Algorithms & Data Structures",
          "System Design",
          "API Design",
          "Database Design",
          "Performance Optimization",
          "Security",
        ],
        "Frontend Developer": [
          "Frontend Architecture",
          "Performance Optimization",
          "Accessibility",
          "State Management",
          "Testing",
        ],
        "Backend Developer": [
          "API Design",
          "Database Design",
          "Microservices",
          "Caching",
          "Security",
        ],
        "Full Stack Developer": [
          "Frontend Architecture",
          "API Design",
          "System Design",
          "Database Design",
        ],
        "Data Scientist": [
          "Machine Learning",
          "Data Analysis",
          "Feature Engineering",
          "Model Evaluation",
        ],
        "Data Engineer": [
          "Data Pipelines",
          "Streaming Systems",
          "Data Warehousing",
          "ETL Design",
        ],
        "ML Engineer": [
          "ML Systems",
          "MLOps",
          "Model Deployment",
          "Monitoring",
        ],
        "DevOps Engineer": [
          "Cloud Architecture",
          "CI/CD",
          "Infrastructure as Code",
          "Observability",
        ],
        "Product Manager": [
          "Product Strategy",
          "Prioritization",
          "Metrics & Experiments",
        ],
        "Engineering Manager": [
          "People Management",
          "Delivery Management",
          "System Design",
        ],
        "Security Engineer": ["Security", "Threat Modeling", "AppSec"],
        "Mobile Developer": [
          "iOS",
          "Android",
          "Mobile Performance",
          "Offline-first",
        ],
      };

      const populateDomains = (role) => {
        const options = [""].concat(roleToDomains[role] || []);
        // Preserve current selection if still valid
        const current = domainSelect.value;
        domainSelect.innerHTML = "";
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Select domain...";
        domainSelect.appendChild(placeholder);
        options.slice(1).forEach((d) => {
          const opt = document.createElement("option");
          opt.value = d;
          opt.textContent = d;
          domainSelect.appendChild(opt);
        });
        if (options.includes(current)) {
          domainSelect.value = current;
        } else {
          domainSelect.value = "";
        }
      };

      roleSelect.addEventListener("change", (e) => {
        populateDomains(e.target.value);
      });

      // Initial population based on loaded preference or default
      populateDomains(roleSelect.value);
    }
  }

  handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const config = {
      role: formData.get("role"),
      domain: formData.get("domain"),
      mode: formData.get("mode"),
      difficulty: formData.get("difficulty"),
      numQuestions: parseInt(formData.get("numQuestions")),
    };

    // Validate
    if (!config.role) {
      this.showError("Please select a role");
      return;
    }

    // Save preferences
    this.savePreferences();

    // Submit
    this.onSubmit(config);
  }

  showError(message) {
    // Remove existing error
    const existingError = document.querySelector(".error-message");
    if (existingError) {
      existingError.remove();
    }

    // Add new error
    const form = document.getElementById("setupForm");
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.style.cssText = `
            background: #fee2e2;
            color: #dc2626;
            padding: 12px 16px;
            border-radius: 8px;
            margin: 16px 0;
            border: 1px solid #fecaca;
        `;
    errorDiv.textContent = message;
    form.insertBefore(errorDiv, form.querySelector(".form-actions"));

    // Auto-remove after 5 seconds
    setTimeout(() => errorDiv.remove(), 5000);
  }

  savePreferences() {
    const form = document.getElementById("setupForm");
    if (!form) return;

    const preferences = {
      role: form.role.value,
      domain: form.domain.value,
      mode: form.mode.value,
      difficulty: form.difficulty.value,
      numQuestions: form.numQuestions.value,
    };

    Utils.saveToStorage("interviewPreferences", preferences);
  }

  loadSavedPreferences() {
    const preferences = Utils.loadFromStorage("interviewPreferences");
    if (!preferences) return;

    const form = document.getElementById("setupForm");
    if (!form) return;

    Object.keys(preferences).forEach((key) => {
      const element = form[key];
      if (element && preferences[key]) {
        element.value = preferences[key];
      }
    });
  }

  showPresetOptions() {
    const presets = {
      "Junior Software Engineer": {
        role: "Software Engineer",
        domain: "Algorithms & Data Structures",
        mode: "Technical",
        difficulty: "Easy",
        numQuestions: 4,
      },
      "Senior Software Engineer": {
        role: "Software Engineer",
        domain: "System Design",
        mode: "Technical",
        difficulty: "Hard",
        numQuestions: 6,
      },
      "Frontend Developer": {
        role: "Frontend Developer",
        domain: "Frontend Architecture",
        mode: "Technical",
        difficulty: "Medium",
        numQuestions: 5,
      },
      "Data Science Role": {
        role: "Data Scientist",
        domain: "Machine Learning",
        mode: "Technical",
        difficulty: "Medium",
        numQuestions: 5,
      },
      "Behavioral Interview": {
        role: "Software Engineer",
        domain: "",
        mode: "Behavioral",
        difficulty: "Medium",
        numQuestions: 5,
      },
    };

    const presetNames = Object.keys(presets);
    const selectedPreset = prompt(
      "Select a preset configuration:\n\n" +
        presetNames.map((name, index) => `${index + 1}. ${name}`).join("\n") +
        "\n\nEnter the number (1-" +
        presetNames.length +
        "):"
    );

    const presetIndex = parseInt(selectedPreset) - 1;
    if (presetIndex >= 0 && presetIndex < presetNames.length) {
      const presetName = presetNames[presetIndex];
      const preset = presets[presetName];
      this.applyPreset(preset);
    }
  }

  applyPreset(preset) {
    const form = document.getElementById("setupForm");
    if (!form) return;

    Object.keys(preset).forEach((key) => {
      const element = form[key];
      if (element) {
        element.value = preset[key];
      }
    });
  }

  reset() {
    const form = document.getElementById("setupForm");
    if (form) {
      form.reset();
      form.mode.value = "Technical";
      form.difficulty.value = "Medium";
      form.numQuestions.value = "5";
    }
  }
}
