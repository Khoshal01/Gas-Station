import {mockStation,signIn} from './helpers';
import {test,expect} from '@playwright/test';
test('short desktop sidebar contains footer and scrolls navigation in every language',async({page})=>{
 await page.setViewportSize({width:1280,height:600});await mockStation(page);await page.goto('/');
 await signIn(page);
 for(const lang of ['en','ps','fa']){
  await page.locator('.topbar select').selectOption(lang);
  const bounds=await page.locator('.sidebar').evaluate(el=>{
   const sidebar=el.getBoundingClientRect(),footer=el.querySelector('.sidebar-footer').getBoundingClientRect(),nav=el.querySelector('nav');
   return {bottom:sidebar.bottom,footerBottom:footer.bottom,footerTop:footer.top,navBottom:nav.getBoundingClientRect().bottom,scrolls:nav.scrollHeight>nav.clientHeight};
  });
  expect(bounds.footerBottom).toBeLessThanOrEqual(bounds.bottom);
  expect(bounds.navBottom).toBeLessThanOrEqual(bounds.footerTop);
  expect(bounds.scrolls).toBe(true);
  await expect(page.locator('.logout')).toBeInViewport();
 }
 await page.locator('.topbar select').selectOption('en');
 await page.screenshot({path:'artifacts/sidebar-short-desktop.png'});
 await page.setViewportSize({width:390,height:600});
 await expect(page.locator('.logout')).toBeInViewport();
 await page.locator('.logout').click();
 await expect(page.getByRole('heading',{name:'Welcome back.'})).toBeVisible();
});
