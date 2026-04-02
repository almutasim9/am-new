const fs = require('fs');
const filePath = '/Users/almutasim_abed/Downloads/am-new/src/components/PerformanceDashboard.jsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Replacements
content = content.replace(
  "const [targetSheet, setTargetSheet] = useState('Monthly Calendar');",
  "const [activeTab, setActiveTab] = useState('monthly'); // 'monthly', 'commercial', 'yesterday'"
);

const extractionLogic = `
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      const updatesMap = {};
      let anyMatched = 0;

      const sheetTypes = [
        { key: 'monthly', searchFor: 'Monthly Calendar', label: 'شهري' },
        { key: 'commercial', searchFor: 'Commercial Calendar', label: 'تجاري' },
        { key: 'yesterday', searchFor: 'Yesterday', label: 'البارحة' }
      ];
      
      let sheetsFound = [];

      for (const st of sheetTypes) {
        const actualName = workbook.SheetNames.find(n => n.toLowerCase().includes(st.searchFor.toLowerCase()));
        if (!actualName) continue;
        
        sheetsFound.push(st.label);

        const worksheet = workbook.Sheets[actualName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (json.length < 5) continue;

        let headerRowIdx = -1;
        for (let i = 0; i < 10; i++) {
          if (json[i] && json[i].includes('Store Name')) {
            headerRowIdx = i;
            break;
          }
        }
        if (headerRowIdx === -1) continue;

        const headers = json[headerRowIdx];
        const nameIdx = headers.findIndex(h => h === 'Store Name');
        const ordersIdx = headers.findIndex(h => h === 'Orders');
        const gmvIdx = headers.findIndex(h => h === 'GMV');
        const ratingsIdx = headers.findIndex(h => h === 'Ratings');
        const avgCartIdx = headers.findIndex(h => h === 'Avg. Cart');
        const discountIdx = headers.findIndex(h => h === 'Discount');
        const deliveryIdx = headers.findIndex(h => h === 'Delivery');
        const itemsTotalIdx = headers.findIndex(h => h === 'Items Total');
        const totalMvIdx = headers.findIndex(h => h === 'Total MV');
        const totalMvhIdx = headers.findIndex(h => h === 'Total MVH');
        const mvPercentIdx = headers.findIndex(h => h === 'MV %');
        const mvhPercentIdx = headers.findIndex(h => h === 'MVH %');
        const highlightsIdx = headers.findIndex(h => h === 'Highlights' || h === 'Highlight');
        const hlPercentIdx = headers.findIndex(h => h === 'HL %');
        const newHlPercentIdx = headers.findIndex(h => h === 'New HL %' || h === 'New HL%');
        const storeCreditsIdx = headers.findIndex(h => h === 'Store Credits Use' || h === 'Store Credits Used');
        const discountPercentIdx = headers.findIndex(h => h === 'Discount %');
        const totersPlusPercentIdx = headers.findIndex(h => h === 'Toters+ %' || h === 'Toters+ Stores %');
        const ordersPercentIdx = headers.findIndex(h => h === 'Orders %');

        for (let i = headerRowIdx + 1; i < json.length; i++) {
          const row = json[i];
          if (!row || !row[nameIdx]) continue;
          
          let storeNameRaw = String(row[nameIdx]).trim();
          if (storeNameRaw.toLowerCase() === 'grand total' || !storeNameRaw) continue;

          const dbStore = stores.find(s => 
            s.name.toLowerCase().trim() === storeNameRaw.toLowerCase() || 
            s.name.includes(storeNameRaw) || 
            storeNameRaw.includes(s.name)
          );

          if (dbStore) {
            anyMatched++;
            if (!updatesMap[dbStore.id]) {
              // initialize
              updatesMap[dbStore.id] = {
                id: dbStore.id,
                performance_data: dbStore.performance_data || { monthly: {}, commercial: {}, yesterday: {} },
                last_sync_date: new Date().toISOString()
              };
            }

            const metricsObj = {
              orders: parseFloat(row[ordersIdx]) || 0,
              gmv: parseFloat(row[gmvIdx]) || 0,
              ratings: parseFloat(row[ratingsIdx]) || 0,
              avg_cart: parseFloat(String(row[avgCartIdx]).replace(/,/g, '')) || 0,
              discount_amount: parseFloat(String(row[discountIdx]).replace(/,/g, '')) || 0,
              delivery: parseFloat(String(row[deliveryIdx]).replace(/,/g, '')) || 0,
              items_total: itemsTotalIdx > -1 ? (parseFloat(String(row[itemsTotalIdx]).replace(/,/g, '')) || 0) : 0,
              total_mv: totalMvIdx > -1 ? (parseFloat(String(row[totalMvIdx]).replace(/,/g, '')) || 0) : 0,
              total_mvh: totalMvhIdx > -1 ? (parseFloat(String(row[totalMvhIdx]).replace(/,/g, '')) || 0) : 0,
              mv_percent: mvPercentIdx > -1 ? (parseFloat(String(row[mvPercentIdx]).replace(/%/g, '')) || 0) : 0,
              mvh_percent: mvhPercentIdx > -1 ? (parseFloat(String(row[mvhPercentIdx]).replace(/%/g, '')) || 0) : 0,
              highlights: highlightsIdx > -1 ? (parseFloat(String(row[highlightsIdx]).replace(/,/g, '')) || 0) : 0,
              hl_percent: hlPercentIdx > -1 ? (parseFloat(String(row[hlPercentIdx]).replace(/%/g, '')) || 0) : 0,
              new_hl_percent: newHlPercentIdx > -1 ? (parseFloat(String(row[newHlPercentIdx]).replace(/%/g, '')) || 0) : 0,
              store_credits_use: storeCreditsIdx > -1 ? (parseFloat(String(row[storeCreditsIdx]).replace(/,/g, '')) || 0) : 0,
              discount_percent: discountPercentIdx > -1 ? (parseFloat(String(row[discountPercentIdx]).replace(/%/g, '')) || 0) : 0,
              toters_plus_percent: totersPlusPercentIdx > -1 ? (parseFloat(String(row[totersPlusPercentIdx]).replace(/%/g, '')) || 0) : 0,
              orders_percent: ordersPercentIdx > -1 ? (parseFloat(String(row[ordersPercentIdx]).replace(/%/g, '')) || 0) : 0
            };

            updatesMap[dbStore.id].performance_data[st.key] = metricsObj;

            // Optional: fallback monthly values to the root level variables so old UI doesn't crash prior to complete architectural migration
            if (st.key === 'monthly') {
               Object.assign(updatesMap[dbStore.id], metricsObj);
            }
          }
        }
      }

      const updatesToUpload = Object.values(updatesMap);
      
      setReportStats({ matched: updatesToUpload.length, notFound: 0 }); 

      if (updatesToUpload.length > 0) {
        await storeService.bulkUpdateMetrics(updatesToUpload);
        notify('success', \`تم تحديث \${updatesToUpload.length} متجر بنجاح من الشيتات (\${sheetsFound.join('، ')})\`);
        if (onFetchInitialData) {
          await onFetchInitialData();
        }
      } else {
        notify('error', 'لم يتم مطابقة أي شيتات أو متاجر بطريقة صحيحة.');
      }

    } catch (err) {
      console.error(err);
      notify('error', err.message || 'حدث خطأ أثناء معالجة الملف');
    } finally {
      setIsProcessing(false);
      event.target.value = null; // reset input
    }
`;

const tryCatchRegex = /try\s*{[\s\S]*?}\s*catch\s*\(err\)\s*{[\s\S]*?}\s*finally\s*{[\s\S]*?}/;
content = content.replace(tryCatchRegex, extractionLogic.trim());

fs.writeFileSync(filePath, content, 'utf-8');
