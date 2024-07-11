export const FETCH_USER_DETAILS = "SELECT CODIGO as id, NOME AS userName FROM operadores";
export const FETCH_SECTOR_DETAILS = "SELECT CODIGO AS id, NOME AS sectorName FROM w_setores";

export const FETCH_CONTACT_DETAILS =
    "SELECT\n" +
    "\tctt.CODIGO as id,\n" +
    "\tcli.RAZAO as customerName,\n" +
    "\tcli.CPF_CNPJ as customerCnpj,\n" +
    "\tctt.NOME as contactName\n" +
    "FROM w_clientes_numeros ctt\n" +
    "LEFT JOIN clientes cli ON cli.CODIGO = ctt.CODIGO_CLIENTE";

export interface UserDetails {
    id: number;
    userName: string;
}

export interface SectorDetails {
    id: number;
    sectorName: string;
}

export interface ContactDetails {
    id: number;
    customerName: string;
    customerCnpj: string;
    contactName: string;
    sectorName: string;
}
