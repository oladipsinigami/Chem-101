import asyncio, os
from playwright.async_api import async_playwright

BASE = r"C:\Users\oladips\Downloads\Chem 101\ui"
SRC = "file:///C:/Users/oladips/Downloads/Chem%20101/ui/mockups.html"
OUT = os.path.join(BASE, "shots")
os.makedirs(OUT, exist_ok=True)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome")
        ctx = await b.new_context(viewport={"width": 1520, "height": 1000}, device_scale_factor=2)
        page = await ctx.new_page()
        await page.goto(SRC, wait_until="networkidle")
        await page.evaluate("document.fonts.ready")
        await page.wait_for_timeout(400)
        boards = await page.query_selector_all(".board")
        print("boards:", len(boards))
        names = ["d-light", "d-dark", "tablet", "mobile", "dialog", "sheet", "receipt"]
        for i, el in enumerate(boards):
            await el.screenshot(path=os.path.join(OUT, f"{i+1:02d}-{names[i]}.png"))
        await b.close()

asyncio.run(main())
print("ok")
