export default class AudienceService {
    getAudience() {
        return fetch('demo/data/audiences.json')
            .then((res) => res.json())
            .then((d) => d.data);
    }


}
