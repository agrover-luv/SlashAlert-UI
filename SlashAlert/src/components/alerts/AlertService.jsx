import { Alert } from "@/api/entities";
import { User } from "@/api/entities";
import { Product } from "@/api/entities";
import { SendEmail } from "@/api/integrations";

export class AlertService {
  static async checkPriceAlert(product, newPrice, oldPrice) {
    try {
      const user = await User.me();
      
      // Check if target price is met
      if (product.target_price && newPrice <= product.target_price && oldPrice > product.target_price) {
        await this.sendTargetPriceAlert(product, user, newPrice, oldPrice);
      }
      
      // Check for significant price drops (>10%)
      const priceDropPercentage = ((oldPrice - newPrice) / oldPrice) * 100;
      if (priceDropPercentage >= 10) {
        await this.sendPriceDropAlert(product, user, newPrice, oldPrice, priceDropPercentage);
      }
      
    } catch (error) {
      console.error('Error checking price alerts:', error);
    }
  }

  static async sendTargetPriceAlert(product, user, currentPrice, previousPrice) {
    const message = `🎉 Great news! ${product.name} has reached your target price of $${product.target_price.toFixed(2)}! Current price: $${currentPrice.toFixed(2)} (was $${previousPrice.toFixed(2)})`;
    
    // Create alert record
    const alert = await Alert.create({
      product_id: product.id,
      user_id: user.id,
      alert_type: 'target_reached',
      trigger_price: currentPrice,
      previous_price: previousPrice,
      message: message
    });

    // Send notifications
    await this.sendNotifications(alert, product, user, message);
  }

  static async sendPriceDropAlert(product, user, currentPrice, previousPrice, dropPercentage) {
    const message = `📉 Price drop alert! ${product.name} is now $${currentPrice.toFixed(2)} (${dropPercentage.toFixed(1)}% off from $${previousPrice.toFixed(2)})`;
    
    // Create alert record
    const alert = await Alert.create({
      product_id: product.id,
      user_id: user.id,
      alert_type: 'price_drop',
      trigger_price: currentPrice,
      previous_price: previousPrice,
      message: message
    });

    // Send notifications
    await this.sendNotifications(alert, product, user, message);
  }

  static async sendNotifications(alert, product, user, message) {
    let emailSent = false;
    let smsSent = false;

    // Send email notification
    if (user.email_alerts_enabled !== false) {
      try {
        await SendEmail({
          to: user.email,
          subject: `Price Alert: ${product.name}`,
          body: this.generateEmailBody(product, message)
        });
        emailSent = true;
      } catch (error) {
        console.error('Failed to send email alert:', error);
      }
    }

    // SMS would be sent here if we had SMS integration
    // For now, we'll simulate it for premium users
    if (user.sms_alerts_enabled && user.phone_number && user.subscription_plan === 'premium') {
      // Simulate SMS sending
      console.log(`SMS would be sent to ${user.phone_number}: ${message}`);
      smsSent = true;
    }

    // Update alert record
    await Alert.update(alert.id, {
      email_sent: emailSent,
      sms_sent: smsSent,
      sent_at: new Date().toISOString()
    });
  }

  static generateEmailBody(product, message) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #3b82f6, #60a5fa); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🔔 Price Alert</h1>
          <p style="color: #dbeafe; margin: 10px 0 0 0; font-size: 16px;">Your price tracking just paid off!</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 22px;">${product.name}</h2>
          
          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #475569; margin: 0; font-size: 16px; line-height: 1.6;">${message}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${product.url}" 
               style="background: linear-gradient(135deg, #3b82f6, #60a5fa); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      display: inline-block;
                      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
              🛒 View Product
            </a>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
            <p style="color: #64748b; font-size: 14px; margin: 0; text-align: center;">
              You're receiving this because you set up price tracking for this product.<br>
              Happy shopping! 🎉
            </p>
          </div>
        </div>
      </div>
    `;
  }
}