import { chromium } from 'playwright'

(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })

  await page.goto('http://localhost:3000')
  await page.waitForTimeout(3000)

  // Click on the first save slot to start the game
  const slot = await page.$('.slot-card')
  if (slot) await slot.click()
  await page.waitForTimeout(2000)

  // Skip the prologue presentation if it appears
  const skipBtn = await page.$('.presentation-skip')
  if (skipBtn) {
    await skipBtn.click()
    await page.waitForTimeout(500)
  }
  
  // Also click through any remaining presentation slides
  for (let i = 0; i < 5; i++) {
    const nextBtn = await page.$('.presentation-next')
    if (nextBtn) {
      await nextBtn.click()
      await page.waitForTimeout(300)
    } else {
      break
    }
  }
  
  await page.waitForTimeout(2000)

  // Take screenshot of full page focusing on top bar
  await page.screenshot({ path: 'screenshots/resource_display_full.png', fullPage: false })

  // Take screenshot of just the top bar area
  const topBar = await page.$('.top-bar')
  if (topBar) {
    await topBar.screenshot({ path: 'screenshots/resource_display_topbar.png' })
  }

  // Take screenshot of right stats area
  const rightStats = await page.$('.top-bar-right')
  if (rightStats) {
    await rightStats.screenshot({ path: 'screenshots/resource_display_right.png' })
  }

  // Also check if there's a ResourceBar component used anywhere
  const resourceBar = await page.$('.resource-bar')
  if (resourceBar) {
    await resourceBar.screenshot({ path: 'screenshots/resource_display_bar.png' })
  }

  console.log('Screenshots taken')
  await browser.close()
})()
