from rest_framework import serializers

class CreateOrganizationSerializer(serializers.Serializer):
    organization_name = serializers.CharField()
    admin_email = serializers.EmailField()
    admin_password = serializers.CharField(write_only=True)
