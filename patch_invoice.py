import os

file_path = r'c:/Users/Eduardo/Desktop/hotel/app.js'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_show_invoice = """function showInvoice(resId) {
  try {
    const res = DB.reservations.find(r => r.id === resId);
    if (!res) return showToast('Reserva no encontrada', 'error');

    // Create a printable window or modal
    const invoiceHTML = generateInvoiceHTML(res);

    // Create invoice container if not exists
    let invoiceModal = document.getElementById('invoiceModal');
    if (!invoiceModal) {
        invoiceModal = document.createElement('div');
        invoiceModal.id = 'invoiceModal';
        invoiceModal.className = 'modal-invoice'; // Specific class to avoid conflicts
        invoiceModal.innerHTML = `
            <div class="modal-content" style="max-width:800px; padding:0; position:relative; z-index:100001">
                <div class="modal-header">
                    <h3 class="modal-title">Factura</h3>
                    <button class="close-btn" onclick="closeInvoice()" style="font-size:24px; cursor:pointer">&times;</button>
                </div>
                <div class="modal-body" id="invoiceBody" style="background:white; color:black; font-family: 'Courier New', monospace; padding:40px"></div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="closeInvoice()">Cerrar</button>
                    <button class="btn btn-primary" onclick="printInvoice()">🖨️ Imprimir / Guardar PDF</button>
                </div>
            </div>
        `;
        document.body.appendChild(invoiceModal);
    }

    // Inject styles for modal view
    const styles = `
        <style>
            /* Specific Modal Styles for Invoice */
            .modal-invoice {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.6);
                display: none; /* Hidden by default */
                align-items: center;
                justify-content: center;
                z-index: 100000; /* Extremely high z-index */
                backdrop-filter: blur(2px);
            }
            .modal-invoice.active {
                display: flex !important;
            }
            
            /* Invoice Content Styles */
            #invoiceBody { font-family: 'Times New Roman', serif; color: #333; line-height: 1.6; }
            #invoiceBody .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            #invoiceBody h1 { margin: 0 0 10px 0; font-size: 28px; text-transform: uppercase; }
            #invoiceBody .meta { display: flex; justify-content: space-between; margin-bottom: 40px; }
            #invoiceBody table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            #invoiceBody th { text-align: left; border-bottom: 2px solid #333; padding: 10px; font-weight: bold; text-transform: uppercase; font-size: 12px; }
            #invoiceBody td { border-bottom: 1px solid #ddd; padding: 10px; font-size: 14px; }
            #invoiceBody .totals { text-align: right; margin-top: 30px; }
            #invoiceBody .total-row { display: flex; justify-content: flex-end; gap: 40px; margin-bottom: 8px; font-size: 14px; }
            #invoiceBody .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 15px; margin-top: 10px; }
        </style>
    `;

    document.getElementById('invoiceBody').innerHTML = styles + invoiceHTML;
    
    // Force open with class and inline style
    const modal = document.getElementById('invoiceModal');
    if (modal) {
        modal.className = 'modal-invoice active'; 
        modal.style.display = 'flex';
        console.log('Invoice Modal Opened via showInvoice');
    }

  } catch (e) {
    console.error(e);
    showToast('Error generando factura: ' + e.message, 'error');
  }
}

function closeInvoice() {
    const modal = document.getElementById('invoiceModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none'; // Force hide
    }
}
"""

# Find start and end of showInvoice
start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if 'function showInvoice(resId) {' in line:
        start_idx = i
        break

if start_idx != -1:
    # Find the closing brace for the function
    # Simple brace counting
    brace_count = 0
    found_start = False
    for i in range(start_idx, len(lines)):
        line = lines[i]
        brace_count += line.count('{')
        brace_count -= line.count('}')
        if brace_count == 0:
            end_idx = i
            break
            
    if end_idx != -1:
        print(f"Replacing lines {start_idx} to {end_idx}")
        # Replace the range with new content
        # We need to ensure we don't break the file structure
        
        new_lines = lines[:start_idx] + [new_show_invoice + "\n"] + lines[end_idx+1:]
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
            
        print("Successfully patched showInvoice and added closeInvoice.")
    else:
        print("Could not find end of showInvoice function.")
else:
    print("Could not find showInvoice function.")
