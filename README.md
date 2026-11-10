# MagHeart

MagHeart is a research prototype for breaking the ice at the start of a hybrid meeting. People in the room and a remote participant use prompt cards to design a LEGO minifigure together. The group places the figure on a magnetic levitation device that moves at the pace of the remote participant’s heart rate.

[Read the CHI EA ’26 paper](https://doi.org/10.1145/3772363.3798371) · [BibTeX](#citation)

## System components

- The [web interface](web/frontend/) guides participants through choosing an avatar, answering cards, building their figures, and showing each other the results.
- The [Apple Watch and iPhone apps](MagHeartApp/) collect the remote participant’s heart rate on the watch and upload readings through the phone.
- The [FastAPI backend](web/backend/) manages meeting sessions and streams heart rate updates to connected clients.
- The [physical device](Device/) uses a microcontroller to translate heart rate readings into motion. See the [Arduino setup guide](docs/QUICKSTART_ARDUINO.md) to connect it.

## Run the web prototype locally

Start with Python 3.10 or later, Node.js 22.12 or later with npm, and a running Redis server. The commands below assume Redis is listening on port 6379 on your machine. You can try the web flow and send a sample heart rate without a watch or levitation device.

From the repository root, start the backend in one terminal:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r web/backend/requirements.txt
export REDIS_URL=redis://127.0.0.1:6379/0
python -m uvicorn web.backend.app:app --reload --port 7000
```

In a second terminal, start the frontend from the repository root:

```sh
cd web/frontend
npm ci
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`) to choose an identity and enter the meeting lobby. Vite forwards API and meeting traffic to the backend on port 7000.

To try the heart rate stream, open `http://localhost:7000/events?userId=demo` and send a sample from a terminal:

```sh
curl http://localhost:7000/api/heart_rate \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: demo' \
  -d '{"bpm":85,"ts":1730704523123,"device":"demo"}'
```

The stream displays a heart rate event for user `demo` with a reading of 85 BPM.

## Citation

```bibtex
@inproceedings{10.1145/3772363.3798371,
  author = {Sun, Black and Xu, Haiyang and Kacy Fu, Ge and Da, Liyue and Hoggan, Eve},
  title = {MagHeart: Exploring Playful Avatar Co-Creation and Shared Heartbeats for Icebreaking in Hybrid Meetings},
  year = {2026},
  isbn = {9798400722813},
  publisher = {Association for Computing Machinery},
  address = {New York, NY, USA},
  url = {https://doi.org/10.1145/3772363.3798371},
  doi = {10.1145/3772363.3798371},
  booktitle = {Proceedings of the Extended Abstracts of the 2026 CHI Conference on Human Factors in Computing Systems},
  articleno = {443},
  numpages = {5},
  keywords = {Hybrid Meetings, Icebreaking, Avatar Co-Creation, Physiological Signal Sharing, Tangible Interaction},
  location = {Barcelona, Spain},
  series = {CHI EA '26}
}
```
