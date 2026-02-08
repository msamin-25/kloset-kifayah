"""
Kloset Kifayah Backend - Contract Service
"""
from datetime import datetime
from typing import Dict, Any

from app.core.supabase import get_supabase_admin


def generate_contract(rental_data: Dict[str, Any]) -> str:
    """
    Generate HTML contract for a rental.
    
    Args:
        rental_data: Rental record from database
        
    Returns:
        HTML string of the contract
    """
    admin = get_supabase_admin()
    
    # Get listing details
    listing = admin.table("listings").select("*").eq(
        "id", rental_data["listing_id"]
    ).single().execute()
    
    # Get user details
    renter = admin.table("profiles").select("full_name, email, phone").eq(
        "id", rental_data["renter_id"]
    ).single().execute()
    
    owner = admin.table("profiles").select("full_name, email, phone").eq(
        "id", rental_data["owner_id"]
    ).single().execute()
    
    listing_data = listing.data or {}
    renter_data = renter.data or {}
    owner_data = owner.data or {}
    
    contract_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }}
            .header {{ text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }}
            .section {{ margin-bottom: 20px; }}
            .section h2 {{ color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }}
            .info-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }}
            .info-item {{ padding: 5px 0; }}
            .label {{ font-weight: bold; color: #666; }}
            .terms {{ background: #f9f9f9; padding: 15px; border-radius: 5px; }}
            .terms li {{ margin-bottom: 10px; }}
            .signatures {{ display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }}
            .signature-box {{ border-top: 1px solid #333; padding-top: 10px; }}
            .footer {{ text-align: center; margin-top: 40px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Rental Agreement</h1>
            <p>Agreement ID: {rental_data['id']}</p>
            <p>Generated: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>
        </div>
        
        <div class="section">
            <h2>Parties</h2>
            <div class="info-grid">
                <div>
                    <p class="label">Owner (Lender)</p>
                    <p>{owner_data.get('full_name', 'N/A')}</p>
                    <p>{owner_data.get('email', 'N/A')}</p>
                </div>
                <div>
                    <p class="label">Renter (Borrower)</p>
                    <p>{renter_data.get('full_name', 'N/A')}</p>
                    <p>{renter_data.get('email', 'N/A')}</p>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>Item Details</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="label">Item:</span> {listing_data.get('title', 'N/A')}
                </div>
                <div class="info-item">
                    <span class="label">Category:</span> {listing_data.get('category', 'N/A')}
                </div>
                <div class="info-item">
                    <span class="label">Condition:</span> {listing_data.get('condition', 'N/A')}
                </div>
                <div class="info-item">
                    <span class="label">Size:</span> {listing_data.get('size', 'N/A')}
                </div>
            </div>
            <p><span class="label">Description:</span> {listing_data.get('description', 'N/A')}</p>
        </div>
        
        <div class="section">
            <h2>Rental Period</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="label">Start Date:</span> {rental_data['start_date']}
                </div>
                <div class="info-item">
                    <span class="label">End Date:</span> {rental_data['end_date']}
                </div>
                <div class="info-item">
                    <span class="label">Total Days:</span> {rental_data['total_days']}
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>Payment Details</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="label">Daily Rate:</span> ${rental_data['daily_rate']:.2f}
                </div>
                <div class="info-item">
                    <span class="label">Subtotal:</span> ${rental_data['daily_rate'] * rental_data['total_days']:.2f}
                </div>
                <div class="info-item">
                    <span class="label">Security Deposit:</span> ${rental_data['deposit_amount']:.2f}
                </div>
                <div class="info-item">
                    <span class="label">Service Fee:</span> ${rental_data.get('service_fee', 0):.2f}
                </div>
                <div class="info-item">
                    <span class="label">Cleaning Fee:</span> ${rental_data.get('cleaning_fee', 0):.2f}
                </div>
                <div class="info-item">
                    <span class="label"><strong>Total Amount:</strong></span> <strong>${rental_data['total_amount']:.2f}</strong>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>Pickup Location</h2>
            <p><span class="label">Location:</span> {listing_data.get('location', 'N/A')}</p>
            <p><span class="label">Instructions:</span> {listing_data.get('pickup_instructions', 'Contact owner for details')}</p>
        </div>
        
        <div class="section">
            <h2>Terms and Conditions</h2>
            <div class="terms">
                <ol>
                    <li><strong>Care of Item:</strong> The Renter agrees to take reasonable care of the item and return it in the same condition as received, allowing for normal wear.</li>
                    <li><strong>Late Returns:</strong> Late returns may incur additional daily charges at the agreed daily rate. Renter must notify Owner of any delays.</li>
                    <li><strong>Damages:</strong> The Renter is responsible for any damage beyond normal wear. The security deposit may be used to cover repair or replacement costs.</li>
                    <li><strong>Cleaning:</strong> The item should be returned in a clean condition. If the item requires professional cleaning, the cost may be deducted from the deposit.</li>
                    <li><strong>Cancellation:</strong> Either party may cancel before pickup. Cancellation after pickup requires mutual agreement.</li>
                    <li><strong>No Subletting:</strong> The Renter may not sublet or transfer the item to any third party.</li>
                    <li><strong>Deposit Return:</strong> The security deposit will be returned within 48 hours after the Owner confirms the item has been returned in acceptable condition.</li>
                    <li><strong>Dispute Resolution:</strong> Any disputes will be handled through the Kloset Kifayah platform's dispute resolution process.</li>
                </ol>
            </div>
        </div>
        
        <div class="signatures">
            <div class="signature-box">
                <p class="label">Owner Signature</p>
                <p>{owner_data.get('full_name', 'N/A')}</p>
                <p>Date: {datetime.now().strftime('%B %d, %Y')}</p>
            </div>
            <div class="signature-box">
                <p class="label">Renter Signature</p>
                <p>{renter_data.get('full_name', 'N/A')}</p>
                <p>Date: {datetime.now().strftime('%B %d, %Y')}</p>
            </div>
        </div>
        
        <div class="footer">
            <p>This agreement was generated by Kloset Kifayah - Muslim Rental Marketplace</p>
            <p>For questions or disputes, please contact support through the app.</p>
        </div>
    </body>
    </html>
    """
    
    return contract_html
