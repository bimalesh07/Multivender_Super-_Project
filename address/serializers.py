from rest_framework import serializers
from .models import Address

class AddressSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Address
        fields = [
            'id', 
            'user', 
            'full_name', 
            'phone_number', 
            'street_address', 
            'city', 
            'state', 
            'postal_code', 
            'country', 
            'is_default',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate_phone_number(self, value):
      
        if not value.isdigit():
            raise serializers.ValidationError("Phone number must contain only digits.")
        
        if len(value) < 10 or len(value) > 15:
            raise serializers.ValidationError("Phone number must be between 10 and 15 digits.")
        return value