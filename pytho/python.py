from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/analyze', methods=['POST'])
def analyze():
    return jsonify({"diagnóstico": "acne", "tratamento": "Use ácido salicílico!"})

if __name__ == '__main__':
    app.run()

http://127.0.0.1:5000/