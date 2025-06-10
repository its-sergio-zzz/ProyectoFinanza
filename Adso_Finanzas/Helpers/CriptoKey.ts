export async function generarKey(secret: string): Promise<CryptoKey> {
    try {
        return await crypto.subtle.importKey(
            "raw",  // formato de entrada secuencia de bytes sin codificar
            new TextEncoder().encode(secret), // convierte la clave en Uint8Array entendible para importKey
            { name: "HMAC", hash: "SHA-256" }, // define el algoritmo para HMAC, crea una clave con formato sha-256
            false, // define si la clave puede ser importada después de creada, en este caso No 
            ["sign", "verify"] // define para qué puede ser usada la clave: "sign" = firmar datos, "verify" = verificar
        );
    } catch (error) {
        console.error("Error al generar la clave criptográfica:", error);
        throw new Error("Error al generar la clave para JWT");
    }
}