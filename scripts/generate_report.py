#!/usr/bin/env python3
"""
Generate psychiatry daily report HTML using Gemma API.
Reads papers JSON, analyzes with Google GenAI (Gemma), generates styled HTML.
"""

import json
import sys
import os
import argparse
from datetime import datetime, timezone, timedelta

import google.generativeai as genai

MODEL_NAME = "gemma-3-27b-it"

SYSTEM_PROMPT = """雿蝎曄??怠飛????瘛梁?蝛嗅??摮詨?剛??遙?嚗?1. 敺?靘??怠飛?銝哨?蝭拚?箸??瑁摨?蝢抵??弦?孵潛?隢?
2. 撠?蝭??脰?蝜?銝剜?????憿ICO ??
3. 閰摯?嗉摨祕?冽改?擃?銝?雿?
4. ???拙??怎?撠平鈭箏?梯????
頛詨?澆?閬?嚗?- 隤?嚗?擃葉???啁?刻?嚗?- 撠平雿???- 瘥?隢???嚗葉??憿??亥店蝮賜??ICO???摨祕?冽扼?憿?蝐?- ?敺?靘??亦移??TOP 3嚗???/?敶梢?典?撖西?????
"""


def load_papers(input_path: str) -> dict:
    if input_path == "-":
        data = json.load(sys.stdin)
    else:
        with open(input_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    return data


def analyze_papers(api_key: str, papers_data: dict) -> dict:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        model_name=MODEL_NAME,
        system_instruction=SYSTEM_PROMPT,
        generation_config=genai.GenerationConfig(
            temperature=0.3,
            top_p=0.9,
            max_output_tokens=8192,
            response_mime_type="application/json",
        ),
    )

    papers_text = json.dumps(
        papers_data.get("papers", []), ensure_ascii=False, indent=2
    )
    date_str = papers_data.get(
        "date", datetime.now(timezone(timedelta(hours=8))).strftime("%Y-%m-%d")
    )

    prompt = f"""隞乩???{date_str} 敺?PubMed ?????啁移蟡摮豢??鳴???{papers_data.get("count", 0)} 蝭???
隢脰?隞乩???嚗蒂隞?JSON ?澆??嚗?
{{
  "date": "{date_str}",
  "market_summary": "1-2?亥店蝮賜?隞予??擃隅?Ｚ?鈭桅?",
  "top_picks": [
    {{
      "rank": 1,
      "title_zh": "銝剜?璅?",
      "title_en": "English Title",
      "journal": "????,
      "summary": "銝?亥店蝮賜?嚗?擃葉??暺?詨??潛?摨?蝢抬?",
      "pico": {{
        "population": "?弦撠情",
        "intervention": "隞?芣",
        "comparison": "撠蝯?,
        "outcome": "銝餉?蝯?"
      }},
      "clinical_utility": "擃?銝?雿?,
      "utility_reason": "?箔?暻澆祕?函?銝?亥店隤芣?",
      "tags": ["璅惜1", "璅惜2"],
      "url": "?????",
      "emoji": "?賊?emoji"
    }}
  ],
  "all_papers": [
    {{
      "title_zh": "銝剜?璅?",
      "title_en": "English Title",
      "journal": "????,
      "summary": "銝?亥店蝮賜?",
      "clinical_utility": "擃?銝?雿?,
      "tags": ["璅惜1"],
      "url": "???",
      "emoji": "emoji"
    }}
  ],
  "keywords": ["?摮?", "?摮?", "?摮?"],
  "topic_distribution": {{
    "?炳??: 3,
    "蝎曄?????: 2
  }}
}}

???鞈?嚗?{papers_text}

隢祟?詨?????TOP 5-8 蝭????top_picks嚗????扳?摨?嚗擗??all_papers??瘥? paper ??tags 隢?隞乩??豢?嚗?擛梁??移蟡?鋆????豢?蝺?蝷?桃??TSD?撥餈怎????柴??祥?畾粹瘝颯?撠移蟡摮詻???DHD?移蟡?飛??蝬?摮詻?恣?圾?Ｙ???摮詻僑蝎曄??怠飛?冗?蝎曄??怠飛?楊??蝎曄??怠飛??"""

    print(f"[INFO] Sending to {MODEL_NAME} for analysis...", file=sys.stderr)
    try:
        response = model.generate_content(prompt)
        text = response.text
        result = json.loads(text)
        print(
            f"[INFO] Analysis complete: {len(result.get('top_picks', []))} top picks, {len(result.get('all_papers', []))} total",
            file=sys.stderr,
        )
        return result
    except json.JSONDecodeError as e:
        print(f"[ERROR] Failed to parse Gemma response as JSON: {e}", file=sys.stderr)
        print(f"[DEBUG] Raw response: {text[:500]}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"[ERROR] Gemma API call failed: {e}", file=sys.stderr)
        return None


def generate_html(analysis: dict) -> str:
    date_str = analysis.get(
        "date", datetime.now(timezone(timedelta(hours=8))).strftime("%Y-%m-%d")
    )
    date_display = (
        datetime.strptime(date_str, "%Y-%m-%d").strftime("%Y撟?-m??-d??)
        if "-" in date_str
        else date_str
    )

    summary = analysis.get("market_summary", "隞?怎??湔??)
    top_picks = analysis.get("top_picks", [])
    all_papers = analysis.get("all_papers", [])
    keywords = analysis.get("keywords", [])
    topic_dist = analysis.get("topic_distribution", {})

    top_picks_html = ""
    for pick in top_picks:
        tags_html = "".join(
            f'<span class="tag">{t}</span>' for t in pick.get("tags", [])
        )
        utility_class = (
            "utility-high"
            if pick.get("clinical_utility") == "擃?
            else (
                "utility-mid" if pick.get("clinical_utility") == "銝? else "utility-low"
            )
        )
        pico = pick.get("pico", {})
        pico_html = ""
        if pico:
            pico_html = f"""
            <div class="pico-grid">
              <div class="pico-item"><span class="pico-label">P</span><span class="pico-text">{pico.get("population", "-")}</span></div>
              <div class="pico-item"><span class="pico-label">I</span><span class="pico-text">{pico.get("intervention", "-")}</span></div>
              <div class="pico-item"><span class="pico-label">C</span><span class="pico-text">{pico.get("comparison", "-")}</span></div>
              <div class="pico-item"><span class="pico-label">O</span><span class="pico-text">{pico.get("outcome", "-")}</span></div>
            </div>"""

        top_picks_html += f"""
        <div class="news-card featured">
          <div class="card-header">
            <span class="rank-badge">#{pick.get("rank", "")}</span>
            <span class="emoji-icon">{pick.get("emoji", "??")}</span>
            <span class="{utility_class}">{pick.get("clinical_utility", "銝?)}撖衣??/span>
          </div>
          <h3>{pick.get("title_zh", pick.get("title_en", ""))}</h3>
          <p class="journal-source">{pick.get("journal", "")} 繚 {pick.get("title_en", "")}</p>
          <p>{pick.get("summary", "")}</p>
          {pico_html}
          <div class="card-footer">
            {tags_html}
            <a href="{pick.get("url", "#")}" target="_blank">?梯??? ??/a>
          </div>
        </div>"""

    all_papers_html = ""
    for paper in all_papers:
        tags_html = "".join(
            f'<span class="tag">{t}</span>' for t in paper.get("tags", [])
        )
        utility_class = (
            "utility-high"
            if paper.get("clinical_utility") == "擃?
            else (
                "utility-mid"
                if paper.get("clinical_utility") == "銝?
                else "utility-low"
            )
        )
        all_papers_html += f"""
        <div class="news-card">
          <div class="card-header-row">
            <span class="emoji-sm">{paper.get("emoji", "??")}</span>
            <span class="{utility_class} utility-sm">{paper.get("clinical_utility", "銝?)}</span>
          </div>
          <h3>{paper.get("title_zh", paper.get("title_en", ""))}</h3>
          <p class="journal-source">{paper.get("journal", "")}</p>
          <p>{paper.get("summary", "")}</p>
          <div class="card-footer">
            {tags_html}
            <a href="{paper.get("url", "#")}" target="_blank">PubMed ??/a>
          </div>
        </div>"""

    keywords_html = "".join(f'<span class="keyword">{k}</span>' for k in keywords)
    topic_bars_html = ""
    if topic_dist:
        max_count = max(topic_dist.values()) if topic_dist else 1
        for topic, count in topic_dist.items():
            width_pct = int((count / max_count) * 100)
            topic_bars_html += f"""
            <div class="topic-row">
              <span class="topic-name">{topic}</span>
              <div class="topic-bar-bg"><div class="topic-bar" style="width:{width_pct}%"></div></div>
              <span class="topic-count">{count}</span>
            </div>"""

    total_count = len(top_picks) + len(all_papers)

    html = f"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Psychiatry Brain 繚 蝎曄??怠飛??亙 繚 {date_display}</title>
<meta name="description" content="{date_display} 蝎曄??怠飛??亙嚗 AI ?芸?敶 PubMed ??啗???/>
<style>
  *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ background: #000; color: #E3F2FD; font-family: -apple-system, "PingFang TC", "Helvetica Neue", Arial, sans-serif; min-height: 100vh; overflow-x: hidden; }}
  body::before {{ content: ''; position: fixed; bottom: -200px; right: -200px; width: 800px; height: 800px; border-radius: 50%; background: radial-gradient(circle, rgba(107,152,255,0.08) 0%, transparent 70%); pointer-events: none; z-index: 0; }}
  body::after {{ content: ''; position: fixed; top: -200px; left: -200px; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(107,255,168,0.05) 0%, transparent 70%); pointer-events: none; z-index: 0; }}
  .container {{ position: relative; z-index: 1; max-width: 880px; margin: 0 auto; padding: 60px 32px 80px; }}
  header {{ display: flex; align-items: center; gap: 16px; margin-bottom: 52px; animation: fadeDown 0.6s ease both; }}
  .logo {{ width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #6B98FF 0%, #6BFFA8 100%); display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; box-shadow: 0 4px 20px rgba(107,152,255,0.3); }}
  .header-text h1 {{ font-family: -apple-system, "SF Pro Display", sans-serif; font-size: 22px; font-weight: 700; color: #fff; letter-spacing: -0.3px; }}
  .header-meta {{ display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap; align-items: center; }}
  .badge {{ display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; letter-spacing: 0.3px; }}
  .badge-date {{ background: rgba(107,152,255,0.15); border: 1px solid rgba(107,152,255,0.3); color: #6B98FF; }}
  .badge-count {{ background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #90A4AE; }}
  .badge-source {{ background: transparent; color: #546E7A; font-size: 11px; padding: 0 4px; }}
  .summary-card {{ background: rgba(107,152,255,0.05); border: 1px solid rgba(107,152,255,0.15); border-radius: 20px; padding: 28px 32px; margin-bottom: 32px; animation: fadeUp 0.5s ease 0.1s both; }}
  .summary-card h2 {{ font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.6px; color: #6B98FF; margin-bottom: 16px; }}
  .summary-text {{ font-size: 15px; line-height: 1.8; color: #CFE8FF; }}
  .section {{ margin-bottom: 36px; animation: fadeUp 0.5s ease both; }}
  .section-title {{ display: flex; align-items: center; gap: 10px; font-family: -apple-system, "SF Pro Display", sans-serif; font-size: 17px; font-weight: 700; color: #fff; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.07); }}
  .section-icon {{ width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; background: rgba(107,152,255,0.15); }}
  .news-card {{ background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 22px 26px; margin-bottom: 12px; transition: background 0.2s, border-color 0.2s, transform 0.2s; }}
  .news-card:hover {{ background: rgba(107,152,255,0.05); border-color: rgba(107,152,255,0.2); transform: translateY(-2px); }}
  .news-card.featured {{ border-left: 3px solid #6B98FF; }}
  .news-card.featured:hover {{ border-color: #6B98FF; background: rgba(107,152,255,0.06); }}
  .card-header {{ display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }}
  .rank-badge {{ background: linear-gradient(135deg, #6B98FF, #6BFFA8); color: #000; font-weight: 700; font-size: 12px; padding: 2px 8px; border-radius: 6px; }}
  .emoji-icon {{ font-size: 18px; }}
  .card-header-row {{ display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }}
  .emoji-sm {{ font-size: 14px; }}
  .news-card h3 {{ font-size: 15px; font-weight: 600; color: #fff; margin-bottom: 8px; line-height: 1.5; }}
  .journal-source {{ font-size: 12px; color: #6B98FF; margin-bottom: 8px; opacity: 0.7; }}
  .news-card p {{ font-size: 13.5px; line-height: 1.75; color: #90A4AE; }}
  .card-footer {{ margin-top: 12px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }}
  .tag {{ padding: 2px 9px; background: rgba(107,152,255,0.1); border-radius: 6px; font-size: 11px; color: #6B98FF; }}
  .news-card a {{ font-size: 12px; color: #6B98FF; text-decoration: none; opacity: 0.7; margin-left: auto; }}
  .news-card a:hover {{ opacity: 1; }}
  .utility-high {{ color: #6BFFA8; font-size: 11px; font-weight: 600; padding: 2px 8px; background: rgba(107,255,168,0.1); border-radius: 4px; }}
  .utility-mid {{ color: #FFD166; font-size: 11px; font-weight: 600; padding: 2px 8px; background: rgba(255,209,102,0.1); border-radius: 4px; }}
  .utility-low {{ color: #90A4AE; font-size: 11px; font-weight: 600; padding: 2px 8px; background: rgba(255,255,255,0.05); border-radius: 4px; }}
  .utility-sm {{ font-size: 10px; }}
  .pico-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); }}
  .pico-item {{ display: flex; gap: 8px; align-items: baseline; }}
  .pico-label {{ font-size: 10px; font-weight: 700; color: #6BFFA8; background: rgba(107,255,168,0.1); padding: 2px 6px; border-radius: 4px; flex-shrink: 0; }}
  .pico-text {{ font-size: 12px; color: #B0BEC5; line-height: 1.4; }}
  .keywords-section {{ margin-bottom: 36px; }}
  .keywords {{ display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }}
  .keyword {{ padding: 5px 14px; background: rgba(107,152,255,0.07); border: 1px solid rgba(107,152,255,0.18); border-radius: 20px; font-size: 12px; color: #6B98FF; cursor: default; transition: background 0.2s; }}
  .keyword:hover {{ background: rgba(107,152,255,0.15); }}
  .topic-section {{ margin-bottom: 36px; }}
  .topic-row {{ display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }}
  .topic-name {{ font-size: 13px; color: #B0BEC5; width: 100px; flex-shrink: 0; text-align: right; }}
  .topic-bar-bg {{ flex: 1; height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; }}
  .topic-bar {{ height: 100%; background: linear-gradient(90deg, #6B98FF, #6BFFA8); border-radius: 4px; transition: width 0.6s ease; }}
  .topic-count {{ font-size: 12px; color: #6B98FF; width: 24px; }}
  footer {{ margin-top: 56px; padding-top: 22px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 11.5px; color: #37474F; display: flex; justify-content: space-between; animation: fadeUp 0.5s ease 0.5s both; }}
  footer a {{ color: #546E7A; text-decoration: none; }}
  footer a:hover {{ color: #6B98FF; }}
  @keyframes fadeDown {{ from {{ opacity: 0; transform: translateY(-16px); }} to {{ opacity: 1; transform: translateY(0); }} }}
  @keyframes fadeUp {{ from {{ opacity: 0; transform: translateY(16px); }} to {{ opacity: 1; transform: translateY(0); }} }}
  @media (max-width: 600px) {{ .container {{ padding: 36px 18px 60px; }} .summary-card, .news-card {{ padding: 20px 18px; }} .pico-grid {{ grid-template-columns: 1fr; }} footer {{ flex-direction: column; gap: 6px; text-align: center; }} .topic-name {{ width: 70px; font-size: 11px; }} }}
</style>
</head>
<body>
<div class="container">
  <header>
    <div class="logo">??</div>
    <div class="header-text">
      <h1>Psychiatry Brain 繚 蝎曄??怠飛??亙</h1>
      <div class="header-meta">
        <span class="badge badge-date">?? {date_display}</span>
        <span class="badge badge-count">?? {total_count} 蝭???/span>
        <span class="badge badge-source">Powered by PubMed + Gemma AI</span>
      </div>
    </div>
  </header>

  <div class="summary-card">
    <h2>?? 隞?頞典</h2>
    <p class="summary-text">{summary}</p>
  </div>

  {"<div class='section'><div class='section-title'><span class='section-icon'>潃?/span>隞蝎暸 TOP Picks</div>" + top_picks_html + "</div>" if top_picks_html else ""}

  {"<div class='section'><div class='section-title'><span class='section-icon'>??</span>?嗡??澆??釣????/div>" + all_papers_html + "</div>" if all_papers_html else ""}

  {"<div class='topic-section section'><div class='section-title'><span class='section-icon'>??</span>銝駁???</div>" + topic_bars_html + "</div>" if topic_bars_html else ""}

  {"<div class='keywords-section section'><div class='section-title'><span class='section-icon'>?儭?/span>?摮?/div><div class='keywords'>" + keywords_html + "</div></div>" if keywords_html else ""}

  <footer>
    <span>鞈?靘?嚗ubMed 繚 ??璅∪?嚗MODEL_NAME}</span>
    <span><a href="https://github.com/u8901006/Psychiatry-brain">GitHub</a></span>
  </footer>
</div>
</body>
</html>"""

    return html


def main():
    parser = argparse.ArgumentParser(
        description="Generate psychiatry daily report HTML"
    )
    parser.add_argument("--input", required=True, help="Input papers JSON file")
    parser.add_argument("--output", required=True, help="Output HTML file")
    parser.add_argument(
        "--api-key",
        default=os.environ.get("GEMMA_API_KEY", ""),
        help="Google AI API key",
    )
    args = parser.parse_args()

    if not args.api_key:
        print(
            "[ERROR] No API key provided. Set GEMMA_API_KEY env var or use --api-key",
            file=sys.stderr,
        )
        sys.exit(1)

    papers_data = load_papers(args.input)
    if not papers_data or not papers_data.get("papers"):
        print("[WARN] No papers found, generating empty report", file=sys.stderr)
        analysis = {
            "date": datetime.now(timezone(timedelta(hours=8))).strftime("%Y-%m-%d"),
            "market_summary": "隞 PubMed ?怎?啁?蝎曄??怠飛??湔???予???,
            "top_picks": [],
            "all_papers": [],
            "keywords": [],
            "topic_distribution": {},
        }
    else:
        analysis = analyze_papers(args.api_key, papers_data)
        if not analysis:
            print("[ERROR] Analysis failed, cannot generate report", file=sys.stderr)
            sys.exit(1)

    html = generate_html(analysis)
    with open(args.output, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"[INFO] Report saved to {args.output}", file=sys.stderr)


if __name__ == "__main__":
    main()
