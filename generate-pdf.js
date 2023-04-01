const fs = require('fs')
const path = require('path')
const utils = require('util')
const puppeteer = require('puppeteer')
const hb = require('handlebars')
const readFile = utils.promisify(fs.readFile)

async function getTemplateHtml() {
  console.log("Loading template file in memory")
  try {
    const invoicePath = path.resolve("./invoice.html")
    return await readFile(invoicePath, 'utf8')
  } catch (err) {
    return Promise.reject("Could not load html template")
  }
}

function generateInvoiceFileName() {
  const today = new Date()
  const year = today.getFullYear()
  const month = (today.getMonth() + 1).toString().padStart(2, '0')
  const day = today.getDate().toString().padStart(2, '0')

  return `invoice-${year}-${month}-${day}.pdf`
}

async function generatePdf() {
  let data = {}

  getTemplateHtml().then(async (res) => {
    console.log("Compiling the template with handlebars")
    const template = hb.compile(res, { strict: true })
    const result = template(data)
    const html = result
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.setContent(html)

    console.log("Generating the PDF")
    
    if (!fs.existsSync('invoices')) {
      fs.mkdirSync('invoices')
    }

    const invoiceFileName = generateInvoiceFileName()

    await page.pdf({ path: `invoices/${invoiceFileName}`, format: 'A4' })
    await browser.close()
    console.log(`PDF Generated at "invoices/${invoiceFileName}"`)
  }).catch(err => {
    console.error(err)
  })
}

generatePdf()