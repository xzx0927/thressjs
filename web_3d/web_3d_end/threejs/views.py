from django.shortcuts import render

from rest_framework.views import APIView


# Create your views here.


class moxing(APIView):
    def get(self, request):
        name = request.GET.get('username')
        password = request.GET.get('password')
        print(name, password)
        url = './models/ceshi.glb'
        return render(request, 'zhuye.html', {'url': url})

    def post(self, request):
        pass
