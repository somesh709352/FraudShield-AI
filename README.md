# FraudShield AI - Mathematical Intelligence Engine

AI-powered financial fraud detection platform for Indian digital payments (UPI, bank transfers) with advanced mathematical algorithms, statistical models, graph theory, and experimental quantum optimization.

## 🚀 Features

### Mathematical Intelligence Modules

| Module | Description | Algorithms |
|--------|-------------|------------|
| **Graph Fraud Analysis** | Network-based fraud detection | Degree/Betweenness/PageRank centrality, Louvain communities, Johnson's cycle detection, suspicious path analysis |
| **Bayesian Probability** | Fraud probability with evidence | Naive Bayes, Logistic Regression, Random Forest, XGBoost probability comparison |
| **Statistical Anomaly Detection** | Behavioral deviation analysis | Z-score, IQR, Moving averages, Entropy-based analysis |
| **Threshold Optimization** | Cost-sensitive decision tuning | FP/FN cost minimization, F1-optimization, Youden's J, PR-AUC |
| **Quantum Lab (Experimental)** | Investigation prioritization | QUBO formulation, Simulated Annealing, QAOA simulation |
| **Model Performance** | ML model evaluation | AUC-ROC, PR-AUC, Brier score, ECE, PSI, Feature importance |

### Dashboard Pages

1. **Overview** - Real-time metrics, module cards, transaction distribution
2. **Graph Analysis** - Interactive network visualization (Cytoscape), centrality rankings, community detection
3. **Bayesian Analysis** - Evidence-based probability calculation, model comparison, calibration
4. **Anomaly Detection** - Per-account statistical analysis, timeline visualization, Z-score/IQR methods
5. **Threshold Optimization** - Cost curves, PR curves, confusion matrices, sensitivity analysis
6. **Quantum Lab** - QUBO matrix, method comparison, case selection optimization
7. **Model Performance** - PR curves, calibration plots, feature importance, population stability
8. **Settings** - Thresholds, API, notifications, appearance configuration

## 🏗 Architecture

```
fraudshield-ai/
├── backend/                 # FastAPI Python backend
│   ├── api/
│   │   ├── graph_analysis.py    # NetworkX graph fraud detection
│   │   ├── graph_routes.py      # REST endpoints
│   │   ├── bayesian.py          # Bayesian probability (planned)
│   │   ├── statistics.py        # Statistical anomaly detection (planned)
│   │   ├── optimization.py      # Threshold optimization (planned)
│   │   ├── quantum_lab.py       # QUBO/QAOA (planned)
│   │   └── risk_engine.py       # Unified risk scoring (planned)
│   ├── core/
│   │   ├── config.py            # Pydantic settings
│   │   ├── models.py            # Pydantic schemas
│   │   └── database.py          # SQLAlchemy models
│   ├── ml/                      # ML pipeline integration point
│   └── main.py                  # FastAPI app
├── frontend/                  # React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/               # Dashboard pages
│   │   ├── components/          # Reusable components (Charts, Graph)
│   │   └── services/            # API client
│   └── package.json
├── tests/                       # Pytest test suites
└── requirements.txt             # Python dependencies
```

## 📦 Installation

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r ../requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` (frontend) and `http://localhost:8000/docs` (API docs).

## 🧪 Testing

```bash
# Backend tests
cd backend
python -m pytest ../tests/ -v

# Frontend tests
cd frontend
npm test
```

## 📊 Mathematical Foundations

### Graph Theory
- **Degree Centrality**: C_D(v) = deg(v) / (n-1)
- **Betweenness Centrality**: C_B(v) = Σ σ_st(v) / σ_st
- **PageRank**: PR(p_i) = (1-d)/N + d Σ PR(p_j)/L(p_j)
- **Louvain Communities**: Modularity maximization Q = 1/2m Σ (A_ij - k_i k_j / 2m) δ(c_i, c_j)
- **Cycle Detection**: Johnson's algorithm for elementary circuits
- **Suspicious Paths**: Multi-source → common target detection

### Bayesian Inference
- **Bayes' Theorem**: P(Fraud|E) = P(E|Fraud) × P(Fraud) / P(E)
- **Naive Bayes**: P(Fraud|E₁...Eₙ) ∝ P(Fraud) Π P(Eᵢ|Fraud)
- **Model Calibration**: Platt scaling / Isotonic regression

### Statistical Anomaly Detection
- **Z-Score**: z = |x - μ| / σ
- **IQR Method**: Outlier if x < Q1 - 1.5×IQR or x > Q3 + 1.5×IQR
- **Moving Average**: MA_t = (x_t + ... + x_t-n) / n
- **Entropy**: H = -Σ p(x) log p(x)

### Threshold Optimization
- **Cost Function**: Minimize C_FN × FN + C_FP × FP
- **F1-Score**: 2 × Precision × Recall / (Precision + Recall)
- **Youden's J**: Sensitivity + Specificity - 1
- **PR-AUC**: Area under Precision-Recall curve

### Quantum Optimization (Experimental)
- **QUBO**: Minimize xᵀQx where Q_ij = -v_i (diag) + 2P·h_i·h_j (off-diag)
- **Constraint**: Penalty P(Σ h_i x_i - B)² for budget B
- **QAOA**: |ψ⟩ = Π exp(-iβH_M)exp(-iγH_C)|+⟩

## 🔧 Configuration

Key settings in `backend/core/config.py`:

```python
graph_min_transactions: int = 5
graph_suspicious_threshold: float = 0.7
stats_zscore_threshold: float = 3.0
stats_iqr_multiplier: float = 1.5
bayesian_prior_fraud: float = 0.01
optimization_cost_fn: float = 10000.0
optimization_cost_fp: float = 100.0
quantum_shots: int = 1024
```

## 📡 API Endpoints

### Graph Analysis
```
POST /api/v1/graph/analyze          # Full graph analysis
POST /api/v1/graph/centrality       # Centrality metrics
POST /api/v1/graph/communities      # Community detection
POST /api/v1/graph/cycles           # Cycle detection
POST /api/v1/graph/suspicious-paths # Suspicious paths
POST /api/v1/graph/components       # Connected components
GET  /api/v1/graph/health           # Health check
```

### Request Format
```json
{
  "transactions": [
    {
      "transaction_id": "TX001",
      "sender_account": "ACC001",
      "receiver_account": "ACC002",
      "amount": 5000.0,
      "timestamp": "2026-01-01T10:00:00Z",
      "transaction_type": "UPI"
    }
  ],
  "min_transactions": 5,
  "suspicious_threshold": 0.7
}
```

## ⚠️ Important Disclaimers

1. **Not a Criminal Detection System**: This platform identifies *suspicious patterns requiring investigation*. It does NOT label any account holder as a criminal. Graph patterns can have legitimate explanations (payroll, family transfers, marketplace settlements).

2. **Experimental Quantum Module**: The Quantum Lab uses classical simulators only. No quantum hardware required. Results are for research purposes. Do not use for production decisions without rigorous validation.

3. **Synthetic Data**: Demo uses generated synthetic transactions. Replace with real data for production use.

4. **Model Validation**: All ML metrics computed on held-out validation/test sets. No data leakage. Transaction IDs never used as features.

## 🛣 Roadmap

- [ ] Bayesian probability API implementation
- [ ] Statistical anomaly detection API
- [ ] Threshold optimization API
- [ ] Quantum Lab API with Qiskit integration
- [ ] Unified risk engine combining all modules
- [ ] Real-time streaming analysis (Kafka/Flink)
- [ ] Model registry & A/B testing framework
- [ ] Advanced explainability (SHAP, LIME)
- [ ] Multi-tenant support
- [ ] Audit logging & compliance reports

## 📄 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit pull request

## 📞 Support

For issues and questions, please open a GitHub issue.