import { BlockList, isIP } from "node:net";

/**
 * Rangos que nunca deben ser destino de una petición hecha desde el servidor
 * (protección SSRF): loopback, redes privadas, link-local (incluye el endpoint
 * de metadatos de la nube 169.254.169.254), CGNAT, documentación, multicast…
 */
const blocked = new BlockList();

const IPV4: Array<[string, number]> = [
    ["0.0.0.0", 8], // "esta red"
    ["10.0.0.0", 8], // privada
    ["100.64.0.0", 10], // CGNAT
    ["127.0.0.0", 8], // loopback
    ["169.254.0.0", 16], // link-local + metadatos cloud
    ["172.16.0.0", 12], // privada
    ["192.0.0.0", 24], // protocolo IETF
    ["192.0.2.0", 24], // documentación
    ["192.88.99.0", 24], // 6to4 relay
    ["192.168.0.0", 16], // privada
    ["198.18.0.0", 15], // benchmarking
    ["198.51.100.0", 24], // documentación
    ["203.0.113.0", 24], // documentación
    ["224.0.0.0", 4], // multicast
    ["240.0.0.0", 4], // reservado + broadcast
];

const IPV6: Array<[string, number]> = [
    ["::", 96], // sin especificar, loopback, IPv4-compatible
    ["64:ff9b::", 96], // NAT64
    ["64:ff9b:1::", 48], // NAT64 de uso local
    ["100::", 64], // descarte
    ["2001::", 32], // Teredo
    ["2001:db8::", 32], // documentación
    ["2002::", 16], // 6to4
    ["fc00::", 7], // únicas locales
    ["fe80::", 10], // link-local
    ["fec0::", 10], // site-local (obsoleta)
    ["ff00::", 8], // multicast
];

// Nota: NO se añade ::ffff:0:0/96. BlockList ya aplica las reglas IPv4 a las
// direcciones IPv4-mapped (::ffff:127.0.0.1 cae en 127.0.0.0/8), y esa regla
// cubriría además TODO el IPv4 público al compararse en forma mapeada.
for (const [address, prefix] of IPV4) blocked.addSubnet(address, prefix, "ipv4");
for (const [address, prefix] of IPV6) blocked.addSubnet(address, prefix, "ipv6");

/** true si la IP no debe contactarse. Todo lo que no sea una IP válida también se bloquea. */
export function isBlockedIp(ip: string): boolean {
    if (ip.includes("%")) return true; // zone id (fe80::1%eth0)
    const family = isIP(ip);
    if (family === 0) return true;
    return blocked.check(ip, family === 4 ? "ipv4" : "ipv6");
}
