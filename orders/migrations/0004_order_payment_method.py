# Generated manually
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0003_order_shipping_address_alter_order_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='payment_method',
            field=models.CharField(choices=[('UPI', 'UPI'), ('CASH_ON_DELIVERY', 'Cash on Delivery')], default='CASH_ON_DELIVERY', max_length=20),
        ),
    ]
