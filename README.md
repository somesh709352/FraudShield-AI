# FraudShield AI

An analyst-facing mathematical intelligence workspace for exploring transaction-network patterns, statistical anomalies, evidence-based probability, validation thresholds, and experimental investigation prioritization. It does not connect to financial institutions or block payments.

## Architecture

- `backend/main.py`: FastAPI application and route registration.
- `backend/api/graph_analysis.py`: NetworkX graph construction and analysis.
- `backend/api/graph_routes.py`: graph API endpoints under `/api/v1/graph`.
- `backend/api/intelligence_routes.py`: anomaly, Bayesian, threshold, QUBO, and risk endpoints under `/api/v1/intelligence`.
- `backend/ml/intelligence.py`: dependency-light calculation functions.
- `backend/core/intelligence_models.py`: validated request contracts.
- `backend/core/database.py`: existing SQLite transaction and analysis tables; these request-based intelligence endpoints do not persist their inputs or results.
- `frontend/src/pages/`: routed dashboard modules.
- `frontend/src/components/MathematicalWorkbench.tsx`: editable JSON input, synthetic examples, API result display, charts, and method notes.
- `frontend/src/components/GraphVisualization.tsx`: interactive Cytoscape graph and node details.

## Run Locally

From the project directory, create and activate a Python environment, then install the backend dependencies:

```powershell
py -3 -m venv .venv
.venv\Scripts\Activate.ps1
cd backend
python -m pip install -r ..\requirements.txt
python -m uvicorn main:app --reload --port 8000
```

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. The Vite development server proxies `/api` requests to `http://localhost:8000`. FastAPI's interactive API documentation is at `http://localhost:8000/docs`.

## Tests

From the project directory:

```powershell
python -m pytest -q
```

Or run `python run_tests.py`.

## Deploy on Render

The root `Dockerfile` builds the frontend and serves it from FastAPI as one web service. Connect this repository to Render and create a Blueprint from `render.yaml`; Render will build the image and use `/health` for health checks. The GitHub Actions workflow runs the backend tests and frontend production build on pushes and pull requests.

The free Render filesystem is ephemeral. This project currently uses local SQLite and does not persist analysis history, so do not treat that database as production storage. A persistent managed database is required before storing operational records.

## API

All JSON inputs are validated by Pydantic. Invalid or incomplete evidence returns a client error rather than a fabricated result.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/graph/analyze` | Full graph analysis |
| `POST` | `/api/v1/graph/centrality` | Degree, betweenness, and PageRank |
| `POST` | `/api/v1/graph/communities` | Community detection |
| `POST` | `/api/v1/graph/cycles` | Directed cycle detection |
| `POST` | `/api/v1/graph/suspicious-paths` | Short paths to shared beneficiaries |
| `POST` | `/api/v1/graph/components` | Connected components |
| `POST` | `/api/v1/intelligence/anomaly` | Historical amount and timing statistics |
| `POST` | `/api/v1/intelligence/bayesian` | Smoothed Bayesian evidence calculation |
| `POST` | `/api/v1/intelligence/thresholds/optimize` | Cost-sensitive validation threshold comparison |
| `POST` | `/api/v1/intelligence/quantum/prioritize` | Small exact case-selection and QUBO baseline |
| `POST` | `/api/v1/intelligence/risk/evaluate` | Configurable review band over supplied Bayesian evidence |
| `GET` | `/api/v1/intelligence/status` | Configured capability status |

### Statistical Anomaly Example

```json
{
  "history": [
    { "amount": 500, "timestamp": "2026-10-25T09:00:00+05:30", "beneficiary": "shop-a" },
    { "amount": 1200, "timestamp": "2026-10-26T14:00:00+05:30", "beneficiary": "shop-b" },
    { "amount": 900, "timestamp": "2026-10-27T10:00:00+05:30", "beneficiary": "shop-a" }
  ],
  "candidate_amount": 80000,
  "candidate_timestamp": "2026-10-28T02:25:00+05:30",
  "candidate_beneficiary": "new-payee",
  "zscore_threshold": 3,
  "iqr_multiplier": 1.5
}
```

The response contains the actual mean, median, population standard deviation, quartiles, IQR bounds, recent moving average, observed transaction frequency, beneficiary entropy, candidate z-score, and evidence flags. A zero historical standard deviation yields a null z-score when the candidate differs from the constant baseline; IQR remains available.

### Bayesian Example

```json
{
  "training_data": [
    { "fraud": false, "features": { "new_beneficiary": false, "unusual_amount": false } },
    { "fraud": false, "features": { "new_beneficiary": true, "unusual_amount": false } },
    { "fraud": true, "features": { "new_beneficiary": true, "unusual_amount": true } },
    { "fraud": true, "features": { "new_beneficiary": false, "unusual_amount": true } }
  ],
  "evidence": { "new_beneficiary": true, "unusual_amount": true },
  "smoothing_alpha": 1
}
```

The posterior uses the empirical class prior and symmetric additive smoothing for Bernoulli feature likelihoods. Contributions are returned as log-likelihood ratios. The conditional-independence assumption is stated in the response. The probability is **not independently calibrated**, and demonstration data is synthetic.

### Threshold Optimization

Provide equal-length `labels` and `scores` from a held-out `validation` split. Scores must be in `[0,1]`, and both classes must be represented. Optional `thresholds`, `cost_fn`, and `cost_fp` values control the comparison. The response includes confusion counts, precision, recall, F1, average precision (stepwise PR-AUC), and expected cost at each threshold. Do not select or report the threshold as a guarantee of prevention.

### Quantum Lab

`POST /api/v1/intelligence/quantum/prioritize` accepts up to 18 unique cases, each with a nonnegative expected value and a positive integer resource cost, plus a resource limit. It returns an exact classical constrained optimum, a QUBO matrix and exact QUBO-assignment baseline. This is exponential enumeration for small experiments. QAOA is reported unavailable; no quantum advantage is claimed.

## Mathematical Methods

- **Degree centrality:** $C_D(v)=deg(v)/(n-1)$.
- **Betweenness centrality:** $C_B(v)=\sum_{s\ne v\ne t}\sigma_{st}(v)/\sigma_{st}$.
- **PageRank:** $PR(v)=(1-d)/n+d\sum_{u\to v}PR(u)/L(u)$.
- **Anomaly z-score:** $z=(x-\mu)/\sigma$; **IQR fences:** $[Q_1-1.5IQR,Q_3+1.5IQR]$.
- **Bayesian update:** posterior odds equal prior odds times the smoothed likelihood ratios of the supplied evidence.
- **Threshold cost:** $C_{FN}FN+C_{FP}FP$; the threshold search uses validation data only.
- **Case-selection QUBO:** $E(x,s)=-\sum_i v_ix_i+\lambda(\sum_i r_ix_i+s-B)^2$, where the binary slack encodes unused capacity.

## Current Limits

- No trained logistic regression, random forest, XGBoost, or combined meta-model is configured. The risk endpoint returns the supplied-data Bayesian posterior with configurable review bands; it is not a calibrated multi-source production model.
- Graph and anomaly measures are indicators for analyst review. They do not determine intent or identify a criminal.
- The Bayesian estimate depends on supplied labeled examples and the naive conditional-independence assumption.
- Threshold metrics are only as representative as the supplied validation split. No held-out institution dataset is bundled.
- The QUBO module is experimental and classical. QAOA and paid quantum hardware are not required or claimed.
- The frontend's bundled examples are synthetic. No financial institution integration, automated payment blocking, or persistent analysis history is configured.